const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a quiz title'],
    trim: true,
    maxlength: [100, 'Name can not be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description can not be more than 500 characters']
  },
  quizType: {
    type: String,
    enum: ['MCQ', 'Descriptive'],
    default: 'MCQ'
  },
  aiEvaluationEnabled: {
    type: Boolean,
    default: false
  },
  wordLimits: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 1000 }
  },
  duration: {
    type: Number,
    required: [true, 'Please add duration in minutes']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Please add total marks']
  },
  category: {
    type: String,
    required: [true, 'Please add a category']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quiz', QuizSchema);
