const SocketMock = require('socket.io-mock');
jest.mock('socket.io-client');
const RoomModel = require('../src/models/RoomModel');
const { MongoClient } = require('mongodb');
const randomChar = require('random-char');

describe('Fast and isolated socket tests', function () {
  let connection;
  let db;
  let rooms;
  beforeAll(async () => {
    connection = await MongoClient.connect(process.env.MONGO_CONNECTION, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = await connection.db();
    rooms = await db.collection('rooms');
  });

  afterAll(async () => {
    await db.close();
  });

  it('Check if user belong to any room, if true, let user join room', function (done) {
    let socket = new SocketMock();

    socket.on('userConnected', async ({ userId }) => {
      try {
        const selectedRoom = await rooms.find({ users: userId }).toArray();
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
      const rooms = db.collection('rooms');
      const newRoom = await rooms.insertOne(roomDetails);
      console.log(newRoom);
      return newRoom;
    } catch (error) {
      console.log(error);
    }
  };

  it('Let user create room', (done) => {
    let socket = new SocketMock();
    socket.on('createRoom', async ({ userId, roomType }) => {
      const roomsDB = db.collection('room');
      let roomName = '';
      let rooms = [];
      do {
        for (let i = 0; i < 6; i++) {
          roomName += randomChar({ upper: true });
        }
        rooms = await roomsDB.find({ roomName }).toArray();
      } while (rooms.length !== 0);
      const newRoom = await createRoom({
        users: [userId],
        roomType,
        ended: false,
        started: false,
        roomName,
      });
      // join room(random alphabet)
      socket.join(roomName);
      // socket emit back room name
      socket.emit('roomName', newRoom);
      // console.log(newRoom);
    });
    socket.socketClient.emit('createRoom', {
      userId: '60aa6d611dab2d0015209172',
      roomType: 'tod',
    });
    done();
  });
});
