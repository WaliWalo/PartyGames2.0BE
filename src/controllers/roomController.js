const Room = require('../models/RoomModel');

const getRoomByUserId = async (req, res, next) => {
  try {
    const room = await Room.findOne({ users: req.params.userId }).populate(
      'users'
    );
    if (room) {
      res.status(200).send(room);
    } else {
      let error = new Error();
      error.httpStatusCode = 404;
      console.log(await Room.find());
      next(error);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = { getRoomByUserId };
