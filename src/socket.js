const socketio = require('socket.io');
const RoomModel = require('../models/RoomModel');
const createSocketServer = (server) => {
  const io = socketio(server);
  io.on('connection', (socket) => {
    console.log(`New socket connection --> ${socket.id}`);
  });

  io.on('userConnected', async (userId) => {
    try {
      const findRoom = await RoomModel.find({ users: userId });
      if (findRoom.length > 0) {
        socket.join(findRoom[0].roomName);
      }
    } catch (error) {
      console.log(error);
    }
  });
};

module.exports = createSocketServer;
