const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    creator: { type: Boolean, required: true },
    turn: { type: Boolean },
    score: { type: Number, default: 0 },
    answer: { type: String, default: '' },
  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);
module.exports = User;
