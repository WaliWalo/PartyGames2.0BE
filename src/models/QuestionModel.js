const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const QuestionSchema = new Schema(
  {
    questionType: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", QuestionSchema);
module.exports = Question;
