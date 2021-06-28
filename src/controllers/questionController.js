const QuestionModel = require('../models/QuestionModel');

const getQuestions = async (req, res, next) => {
  try {
    const questions = await QuestionModel.find();
    res.status(200).send(questions);
  } catch (error) {
    next(error);
  }
};

module.exports = { getQuestions };
