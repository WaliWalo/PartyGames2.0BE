const socketio = require('socket.io');
const RoomModel = require('./models/RoomModel');
const UserModel = require('./models/UserModel');
const MessageModel = require('./models/MessageModel');
const mongoose = require('mongoose');
const {
  generateRoomName,
  checkIfRoomExists,
  checkIfEveryoneAnswered,
  calculateWyrScore,
  updateUserTurn,
} = require('./utils/socketUtil');

const createSocketServer = (server) => {
  const io = socketio(server);
  io.on('connection', (socket) => {
    console.log(`New socket connection --> ${socket.id}`);

    socket.on('disconnect', () => {
      console.log('Disconnected');
    });

    // front end will emit userConnected with the user id stored in
    // local storage every time they access the page
    // then user will be moved to the room automatically
    // even if they close the browser mid way
    socket.on('userConnected', async ({ userId }) => {
      try {
        const findRoom = await RoomModel.find({ users: userId });
        if (findRoom.length > 0) {
          socket.join(findRoom[0].roomName);
        }
      } catch (error) {
        console.log(error);
      }
    });

    // creates a room with username and room type from front end
    // generate unique room name
    // create user
    // creates room and lets user join room
    socket.on('createRoom', async ({ userName, roomType }) => {
      try {
        let roomName = await generateRoomName();

        const newUser = new UserModel({
          name: userName,
          creator: true,
          turn: true,
        });
        const user = await newUser.save();

        const newRoom = new RoomModel({
          users: [mongoose.Types.ObjectId(user._id)],
          roomType,
          ended: false,
          started: false,
          roomName,
        });
        await newRoom.save();

        const roomWithUser = { ...newRoom.toObject(), users: [user] };

        socket.join(roomName);
        socket.emit(socket.id, { status: 'ok', data: roomWithUser });
      } catch (error) {
        console.log(error);
      }
    });

    // lets user joins a room with username and room name
    // check if room exists, then create user and add user to room
    // join user socket to room name
    socket.on('joinRoom', async ({ userName, roomName }) => {
      try {
        if (await checkIfRoomExists(roomName)) {
          const newUser = new UserModel({
            name: userName,
            creator: false,
            turn: false,
          });
          const user = await newUser.save();
          await RoomModel.findOneAndUpdate(
            { roomName },
            { $addToSet: { users: user._id } },
            { useFindAndModify: false }
          );
          socket.join(roomName);
          socket.emit('joinRoom', {
            status: 'ok',
            message: 'Room exist',
            userId: user._id,
          });
          io.in(roomName).emit(roomName, { user: user });
        } else {
          socket.emit('joinRoom', {
            status: 'error',
            message: 'Room do not exist',
          });
        }
      } catch (error) {
        console.log(error);
      }
    });

    socket.on('startGame', async ({ userId, roomName }) => {
      const user = await UserModel.findById(userId);
      if (user.creator) {
        await RoomModel.findOneAndUpdate(
          { roomName },
          { started: true },
          { useFindAndModify: false }
        );
        io.in(roomName).emit('startGame', { message: 'game started' });
      }
    });

    // Returns a random user
    // Check if user's turn, check if room exists
    // Find room
    // Get users from room and filter out current user
    // Get random index from users array and find user with the user id
    // Broadcast user to room
    socket.on('randomUser', async ({ userId, roomName }) => {
      const user = await UserModel.findById(userId);
      const room = await RoomModel.findOne({ roomName });

      if (user.turn === true) {
        if (room) {
          const filteredUsers = room.users.filter(
            (user) => user._id.toString() !== userId
          );
          const selectedUser = await UserModel.findById(
            filteredUsers[Math.floor(Math.random() * filteredUsers.length)]
          );
          io.in(roomName).emit('randomUser', selectedUser);
        } else {
          socket.emit(socket.id, {
            status: 'error',
            data: { msg: 'room not found' },
          });
        }
      } else {
        socket.emit(socket.id, {
          status: 'error',
          data: { msg: 'not user turn' },
        });
      }
    });

    // Broadcast user input
    // Check if user turn
    // Check if room exists
    // Find room, if room started
    // check input type
    // if input type = normal
    // broadcast user input
    // if input type = wyr
    // check if everyone answered
    // update score, broadcast majority
    // clear answer
    // else return user id and value
    socket.on('input', async ({ userId, roomName, type, value }) => {
      const user = await UserModel.findById(userId);
      // if (user.turn) {
      if (await checkIfRoomExists(roomName)) {
        const room = await RoomModel.findOne({ roomName });
        const filteredUsers = room.users.filter(
          (user) => user.toString() !== userId.toString()
        );
        if (room.started) {
          if (type === 'normal') {
            io.in(roomName).emit('input', { value });
          } else if (type === 'wyr') {
            if (await checkIfEveryoneAnswered(filteredUsers)) {
              const majority = await calculateWyrScore(room.users);

              io.in(roomName).emit('input', {
                value: majority,
              });
            } else {
              const updatedUser = await UserModel.findByIdAndUpdate(
                userId,
                {
                  answer: value,
                },
                { useFindAndModify: false, new: true }
              );
              io.in(roomName).emit('input', { user: updatedUser, value });
            }
          }
        } else {
          socket.emit(socket.id, {
            status: 'error',
            data: { msg: 'room not started' },
          });
        }
      } else {
        socket.emit(socket.id, {
          status: 'error',
          data: { msg: 'room not found' },
        });
      }
      // } else {
      //   socket.emit(socket.id, {
      //     status: 'error',
      //     data: { msg: 'not user turn' },
      //   });
      // }
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
    socket.on('nextUser', async ({ userId, roomName }) => {
      const user = await UserModel.findById(userId);
      if (user.turn) {
        if (await checkIfRoomExists(roomName)) {
          const updatedUser = await updateUserTurn(userId, roomName);
          io.in(roomName).emit('nextUser', updatedUser);
        } else {
          socket.emit(socket.id, {
            status: 'error',
            data: { msg: 'room not found' },
          });
        }
      } else {
        socket.emit(socket.id, {
          status: 'error',
          data: { msg: 'not user turn' },
        });
      }
    });

    // Check if user is creator
    // find room
    // for each user in room, delete user from user model
    // delete message where roomid === room.id from message model
    // delete room from room model
    // delete images from cloudinary
    socket.on('endGame', async ({ userId, roomName }) => {
      const user = await UserModel.findById(userId);
      if (user.creator) {
        if (await checkIfRoomExists(roomName)) {
          const room = await RoomModel.findOne({ roomName });
          await UserModel.deleteMany({ _id: { $in: room.users } });
          await RoomModel.deleteOne({ roomName });
          await MessageModel.deleteMany({ roomId: room._id });
          io.in(roomName).emit(roomName, {
            status: 'end',
            data: { msg: 'game ended' },
          });
        } else {
          socket.emit(socket.id, {
            status: 'error',
            data: { msg: 'room not found' },
          });
        }
      } else {
        socket.emit(socket.id, {
          status: 'error',
          data: { msg: 'user is not creator' },
        });
      }
    });

    // Check if user.turn === true
    // change next user turn
    // then remove user from room
    // delete user from user model
    // broadcast user left
    socket.on('leaveRoom', async ({ userId, roomName }) => {
      const user = await UserModel.findById(userId);
      if (user.turn) {
        await updateUserTurn(userId, roomName);
      }
      await RoomModel.findOneAndUpdate(
        { roomName },
        { $pull: { users: userId } }
      );
      await UserModel.findByIdAndDelete(userId);
      io.in(roomName).emit(roomName, { msg: `${user.name} left` });
    });

    // broadcast message to room
    // add message to database
    socket.on('sendMessage', async ({ sender, content, roomName }) => {
      const user = await UserModel.findById(sender);
      if (user) {
        if (await checkIfRoomExists(roomName)) {
          const room = await RoomModel.findOne({ roomName });
          const message = new MessageModel({
            content: content,
            sender: sender,
            roomId: room._id,
          });
          message.save();
          io.in(roomName).emit(roomName, {
            sender: user,
            content: content,
            roomId: room._id,
          });
        } else {
          socket.emit(socket.id, {
            status: 'error',
            data: { msg: 'room not found' },
          });
        }
      } else {
        socket.emit(socket.id, {
          status: 'error',
          data: { msg: 'user not found' },
        });
      }
    });
  });
};

module.exports = createSocketServer;
