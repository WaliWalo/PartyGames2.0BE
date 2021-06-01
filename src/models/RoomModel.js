const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const RoomSchema = new Schema(
  {
    users: [{ type: Schema.ObjectId, ref: 'User', required: true }],
    roomType: { type: String, required: true },
    ended: { type: Boolean },
    started: { type: Boolean },
    roomName: { type: String, required: true },
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', RoomSchema);
module.exports = Room;
