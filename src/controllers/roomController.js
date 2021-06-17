const Room = require('../models/RoomModel');

const getRoomByUserId = async (req, res, next) => {
  try {
    const room = await Room.findOne({ users: req.params.userId }).populate(
      'users'
    );
    console.log('TEST');
    if (room) {
      res.status(200).send(room);
    } else {
      let error = new Error();
      error.httpStatusCode = 404;
      error.message = 'Room not found';
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { getRoomByUserId };
