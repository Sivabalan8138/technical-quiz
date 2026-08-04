const Question = require('../models/Question');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const streamifier = require('streamifier');

// @desc    Get questions for a quiz (Admin gets all, Students get without answers)
// @route   GET /api/v1/quizzes/:quizId/questions
// @access  Private
exports.getQuestions = async (req, res) => {
  try {
    let query = Question.find({ quiz: req.params.quizId });

    // If student, don't send correct answers
    if (req.user.role === 'Student') {
      query = query.select('-correctAnswer');
    }

    const questions = await query;
    res.status(200).json({ success: true, count: questions.length, data: questions });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Add a question
// @route   POST /api/v1/quizzes/:quizId/questions
// @access  Private/Admin
exports.addQuestion = async (req, res) => {
  try {
    req.body.quiz = req.params.quizId;
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update a question
// @route   PUT /api/v1/questions/:id
// @access  Private/Admin
exports.updateQuestion = async (req, res) => {
  try {
    let question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: question });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete a question
// @route   DELETE /api/v1/questions/:id
// @access  Private/Admin
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    await question.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Bulk upload questions from CSV/Excel
// @route   POST /api/v1/quizzes/:quizId/questions/bulk
// @access  Private/Admin
exports.bulkUploadQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a file' });
    }

    const quizId = req.params.quizId;
    const questions = [];

    // Check file extension
    const filename = req.file.originalname.toLowerCase();
    
    if (filename.endsWith('.csv')) {
      // Handle CSV
      streamifier.createReadStream(req.file.buffer)
        .pipe(csv())
        .on('data', (row) => {
          questions.push({
            quiz: quizId,
            text: row.Question || row.text,
            options: {
              A: row.OptionA || row['Option A'] || row.A,
              B: row.OptionB || row['Option B'] || row.B,
              C: row.OptionC || row['Option C'] || row.C,
              D: row.OptionD || row['Option D'] || row.D
            },
            correctAnswer: row.CorrectAnswer || row['Correct Answer'] || row.Answer,
            marks: row.Marks || 1
          });
        })
        .on('end', async () => {
          await Question.insertMany(questions);
          return res.status(201).json({ success: true, count: questions.length, data: 'Questions uploaded successfully' });
        });
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      // Handle Excel
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      data.forEach((row) => {
        questions.push({
          quiz: quizId,
          text: row.Question || row.text,
          options: {
            A: row.OptionA || row['Option A'] || row.A,
            B: row.OptionB || row['Option B'] || row.B,
            C: row.OptionC || row['Option C'] || row.C,
            D: row.OptionD || row['Option D'] || row.D
          },
          correctAnswer: row.CorrectAnswer || row['Correct Answer'] || row.Answer,
          marks: row.Marks || 1
        });
      });

      await Question.insertMany(questions);
      return res.status(201).json({ success: true, count: questions.length, data: 'Questions uploaded successfully' });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid file format' });
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
