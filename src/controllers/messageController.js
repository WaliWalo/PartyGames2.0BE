const Message = require('../models/MessageModel');
const Room = require('../models/RoomModel');

const getMessages = async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.roomId }).populate(
      'users'
    );
    if (room) {
      const messages = await Message.find({
        roomId: req.params.roomId,
      }).populate('sender');

      res.status(200).send(messages);
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

module.exports = { getMessages };
