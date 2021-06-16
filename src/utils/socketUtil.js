const RoomModel = require('../models/RoomModel');
const UserModel = require('../models/UserModel');
const randomChar = require('random-char');

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

const generateRoomName = async () => {
  let roomName = '';
  let uniqueRooms = [];

  do {
    for (let i = 0; i < 6; i++) {
      roomName += randomChar({ upper: true });
    }
    uniqueRooms = await RoomModel.find({ roomName });
  } while (uniqueRooms.length !== 0);

  return roomName;
};

const getUsersFromStrings = async (userIds) => {
  const users = await UserModel.find({ _id: { $in: userIds } });
  return users;
};

const checkIfEveryoneAnswered = async (userIds) => {
  let counter = 0;
  console.log(userIds);
  const users = await getUsersFromStrings(userIds);
  users.forEach((user) => {
    if (user.answer !== '') {
      counter++;
    }
  });
  if (counter === users.length) {
    return true;
  } else {
    return false;
  }
};

const updateScore = async (majority) => {
  await UserModel.updateMany({ answer: majority }, { $inc: { score: 1 } });
};

const clearAnswer = async (userIds) => {
  await UserModel.updateMany({ _id: { $in: userIds } }, { answer: '' });
};

const calculateWyrScore = async (userIds) => {
  let answerA = 0;
  let answerB = 0;

  const users = await getUsersFromStrings(userIds);
  const answers = [...new Set(users.map((user) => user.answer))];

  users.forEach((user) => {
    if (user.answer === answers[0]) {
      answerA++;
    } else {
      answerB++;
    }
  });

  let majority = '';

  if (answerA > answerB) {
    majority = answers[0];
  } else {
    majority = answers[1];
  }

  const winners = await UserModel.find({ answer: majority });

  updateScore(majority);
  clearAnswer(userIds);

  return majority;
};

const updateUserTurn = async (userId, roomName) => {
  const room = await RoomModel.findOne({ roomName });
  const currentIndex = room.users.indexOf(userId);
  let nextUser = '';
  if (currentIndex !== room.users.length - 1) {
    nextUser = room.users[currentIndex + 1];
  } else {
    nextUser = room.users[0];
  }
  await UserModel.findByIdAndUpdate(
    userId,
    { $set: { turn: false } },
    { new: true, upsert: true, useFindAndModify: false }
  );
  const updatedUser = await UserModel.findByIdAndUpdate(
    nextUser,
    { $set: { turn: true } },
    { new: true, upsert: true, useFindAndModify: false }
  );
  return updatedUser;
};

module.exports = {
  checkIfRoomExists,
  generateRoomName,
  checkIfEveryoneAnswered,
  calculateWyrScore,
  updateUserTurn,
};
