const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: mongoose.Schema.ObjectId,
    ref: 'Quiz',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  wrongAnswers: {
    type: Number,
    required: true
  },
  timeTaken: {
    type: Number, // In seconds
    required: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Question'
    },
    selectedOption: String, // For MCQ
    textAnswer: String, // For Descriptive
    attachments: [String], // URLs of uploaded files
    isCorrect: Boolean,
    marksAwarded: Number // Specific marks given by AI
  }],
  aiFeedback: {
    conceptUnderstanding: Number,
    technicalAccuracy: Number,
    logicalExplanation: Number,
    grammar: Number,
    strengths: [String],
    suggestions: [String]
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual: passed if score is >= 50% of totalMarks
ResultSchema.virtual('passed').get(function () {
  return this.totalMarks > 0 && (this.score / this.totalMarks) >= 0.5;
});

module.exports = mongoose.model('Result', ResultSchema);
