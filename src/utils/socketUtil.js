const RoomModel = require('../models/RoomModel');
const User = require('../models/UserModel');

const checkIfRoomExists = async (roomName) => {
  try {
    const room = await RoomModel.find({ roomName });
    if (room.length > 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  checkIfRoomExists,
};
