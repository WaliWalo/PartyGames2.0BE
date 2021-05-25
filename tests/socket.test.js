const SocketMock = require('socket.io-mock');
jest.mock('socket.io-client');
const RoomModel = require('../src/models/RoomModel');
const { MongoClient } = require('mongodb');

describe('Fast and isolated socket tests', function () {
  let connection;
  let db;

  beforeAll(async () => {
    connection = await MongoClient.connect(process.env.MONGO_CONNECTION, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = await connection.db();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('Check if user belong to any room, if true, let user join room', function (done) {
    let socket = new SocketMock();

    socket.on('userConnected', async ({ userId }) => {
      try {
        const rooms = db.collection('room');
        const selectedRoom = await rooms.find({ users: userId });
        if (selectedRoom.length > 0) {
          socket.join(selectedRoom[0].roomName);
        }
      } catch (error) {
        console.log(error);
      }
      done();
    });
    socket.socketClient.emit('userConnected', '60aa6d611dab2d0015209172');
    done();
  });

  const checkIfRoomExists = async (roomName) => {
    try {
      const rooms = db.collection('room');
      const selectedRoom = await rooms.find({ roomName });
      if (selectedRoom.length > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  };

  it('Check if room exist', async (done) => {
    const roomName = 'XXXXXX';
    const roomExist = await checkIfRoomExists(roomName);
    expect(roomExist).toBe(false);
    done();
  });

  const addUserToRoom = async ({ userId, roomName }) => {
    try {
      const rooms = db.collection('room');
      const room = await rooms.findOneAndUpdate(
        { roomName },
        { $addToSet: { users: userId } },
        { useFindAndModify: false }
      );
      return room;
    } catch (error) {
      console.log(error);
    }
  };

  it('Let user join room', (done) => {
    let socket = new SocketMock();

    socket.on('joinRoom', async ({ userId, roomName }) => {
      try {
        const roomExist = await checkIfRoomExists(roomName);
        if (roomExist) {
          await addUserToRoom({ userId, roomName });
          socket.join(roomName, { status: 'ok', message: 'Joined Room' });
          socket.in(roomName).emit('userJoined', { userId });
        } else {
          socket.emit('roomExist', {
            status: 'error',
            msg: 'Room does not exist',
          });
        }
        done();
      } catch (error) {
        console.log(error);
        done();
      }
      done();
    });
    socket.socketClient.emit('joinRoom', {
      userId: '60aa6d611dab2d0015209172',
      roomName: 'xxxxx',
    });
  });

  const createRoom = async (roomDetails) => {
    try {
      const rooms = db.collection('room');
      const newRoom = new rooms(roomDetails);
      const room = await newRoom.save();
      return room;
    } catch (error) {
      console.log(error);
    }
  };
});
