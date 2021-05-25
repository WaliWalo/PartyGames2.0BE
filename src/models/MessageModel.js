const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const MessageSchema = new Schema(
  {
    roomId: { type: mongoose.ObjectId, ref: "Room", required: true },
    content: { type: String, required: true },
    url: { type: String },
    sender: { type: mongoose.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
