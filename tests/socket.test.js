const SocketMock = require('socket.io-mock');
jest.mock('socket.io-client');
const RoomModel = require('../src/models/RoomModel');
const { MongoClient } = require('mongodb');
const randomChar = require('random-char');
const mongoose = require('mongoose');

describe('Fast and isolated socket tests', function () {
  let connection;
  let db;
  let rooms;
  let users;
  beforeAll(async () => {
    connection = await MongoClient.connect(process.env.MONGO_CONNECTION, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = await connection.db();
    rooms = db.collection('rooms');
    users = db.collection('users');
  });

  afterAll(async () => {
    await db.close();
  });

  it('Check if user belong to any room, if true, let user join room', function (done) {
    let socket = new SocketMock();

    // To return user to room if disconnected
    socket.on('userConnected', async ({ userId }) => {
      try {
        const selectedRoom = await rooms.findOne({
          users: mongoose.Types.ObjectId(userId),
        });
        if (selectedRoom) {
          socket.join(selectedRoom.roomName);
          expect(socket.joinedRooms[0]).toBe(selectedRoom.roomName);
        } else {
          expect(socket.joinedRooms.length).toBe(0);
        }
      } catch (error) {
        console.log(error);
      }
      done();
    });
    socket.socketClient.emit('userConnected', {
      userId: '60aa6d611dab2d0015209172',
    });
    done();
  });

  const checkIfRoomExists = async (roomName) => {
    try {
      const selectedRoom = await rooms.findOne({ roomName });
      if (selectedRoom) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  };

  it('Check if room exist', async (done) => {
    const roomName = 'NCRHMV';
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

  const createUser = async (userDetails) => {
    try {
      const newUser = await users.insertOne(userDetails);
      return newUser;
    } catch (error) {
      console.log(error);
    }
  };

  // check if room exists
  // update room model with user id
  it('Let user join room', (done) => {
    let socket = new SocketMock();

    socket.on('joinRoom', async ({ userName, roomName }) => {
      try {
        const roomExist = await checkIfRoomExists(roomName);
        if (roomExist) {
          const newUser = await createUser({
            name: userName,
            creator: true,
            turn: false,
          });
          await addUserToRoom({ userId: newUser._id, roomName });
          socket.join(roomName, { status: 'ok', message: 'Joined Room' });
          expect(socket.joinedRooms[0]).toBe(roomName);
        } else {
          socket.emit('roomExist', {
            status: 'error',
            msg: 'Room does not exist',
          });
          expect(socket.joinedRooms.length).toBe(0);
        }
        done();
      } catch (error) {
        console.log(error);
        done();
      }
      done();
    });
    socket.socketClient.emit('joinRoom', {
      userName: 'JoinRoom',
      roomName: 'ZKJYIZ',
    });
  });

  const createRoom = async (roomDetails) => {
    try {
      const newRoom = await rooms.insertOne(roomDetails);
      return newRoom;
    } catch (error) {
      console.log(error);
    }
  };

  // Generate room name
  // Create room with room name and user id
  it('Let user create room', (done) => {
    let socket = new SocketMock();
    socket.on('createRoom', async ({ userName, roomType }) => {
      const roomsDB = db.collection('room');
      let roomName = '';
      let uniqueRooms = [];
      // to check if any room has the same name
      do {
        for (let i = 0; i < 6; i++) {
          roomName += randomChar({ upper: true });
        }
        uniqueRooms = await rooms.find({ roomName }).toArray();
      } while (uniqueRooms.length !== 0);

      const newUser = await createUser({
        name: userName,
        creator: true,
        turn: true,
      });

      const newRoom = await createRoom({
        users: [mongoose.Types.ObjectId(newUser._id)],
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
      expect(socket.joinedRooms[0]).toBe(roomName);
    });
    socket.socketClient.emit('createRoom', {
      userName: 'CreateRoom',
      roomType: 'tod',
    });
    done();
  });

  // Check if user turn
  // Check if room exist
  // Find Room
  // If room started
  // Get users from room and filter out current user
  // Get a random index from users array and find the user with the user id
  // Broadcast the user to the room
  it('Return a random user', (done) => {
    let socket = new SocketMock();
    socket.on('randomUser', async ({ userId, roomName }) => {
      const user = await users.findOne({
        _id: mongoose.Types.ObjectId(userId),
      });
      const room = await rooms.findOne({ roomName: roomName });
      if (user.turn === true) {
        if (checkIfRoomExists(roomName)) {
          const filteredUsers = room.users.filter(
            (user) => user.toString() !== userId
          );
          const selectedUser = await users.findOne({
            _id: mongoose.Types.ObjectId(
              filteredUsers[Math.floor(Math.random() * filteredUsers.length)]
            ),
          });
          socket.emit('roomName', selectedUser);
          expect(selectedUser.name).toBe('admin');
        } else {
          expect(checkIfRoomExists(roomName)).toBe(false);
        }
      }
    });
    socket.socketClient.emit('randomUser', {
      userId: '60b8a3dc0bef2c0158b5785a',
      roomName: 'LSEHDB',
    });
    done();
  });

  // Check if user turn
  // Check if room exists
  // Find room, if room started
  // check input type
  // broadcast user input
  it('Broadcast user action input', (done) => {
    let socket = new SocketMock();
    socket.on('input', async ({ userId, roomName, type, value }) => {
      const user = await users.findOne({
        _id: mongoose.Types.ObjectId(userId),
      });
      if (user.turn) {
        if (checkIfRoomExists(roomName)) {
          const room = await rooms.findOne({ roomName });
          if (room.started) {
            if (type === 'normal') {
              socket.emit('input', value);
              console.log(socket);
            }
          }
        }
      }
    });

    socket.socketClient.emit('input', {
      userId: '60b8a3dc0bef2c0158b5785a',
      roomName: 'LSEHDB',
      type: 'normal',
      value: 'Truth',
    });
    done();
  });

  // Check if room exist
  // Check if user exist
  // find user index from room.users
  // if userIndex !== room.users.length - 1
  // nextUser = room.users[userIndex + 1]
  // else nextUser = room.users[0]
  // update user.turn to false
  // update nextUser.turn to true
  // broadcast next user
  // it('Change next user turn', (done) => {});

  // Check if user is creator
  // find room
  // for each user in room, delete user from user model
  // delete message where roomid === room.id from message model
  // delete room from room model
  // delete images from cloudinary
  // it('End game', (done) => {});

  // Check if user.turn === true
  // change next user turn
  // then remove user from room
  // delete user from user model
  // broadcast user left
  // it('Leave room / Kick user', (done) => {});

  // broadcast message to room
  // add message to database
  // it('Send Message', (done) => {});
});
