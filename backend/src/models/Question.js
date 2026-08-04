const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.ObjectId,
    ref: 'Quiz',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Please add a question text']
  },
  imageUrl: {
    type: String,
    default: null
  },
  options: {
    A: { type: String },
    B: { type: String },
    C: { type: String },
    D: { type: String }
  },
  correctAnswer: {
    type: String,
    enum: ['A', 'B', 'C', 'D']
  },
  rubric: {
    type: String,
    description: 'Guidelines or keywords for AI evaluation on Descriptive questions'
  },
  marks: {
    type: Number,
    required: [true, 'Please assign marks for this question'],
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', QuestionSchema);
