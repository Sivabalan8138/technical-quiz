const { protect, authorize } = require('../backend/src/utils/auth');
const connectDB = require('../backend/src/config/db');
const Question = require('../backend/src/models/Question');
const busboy = require('busboy');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const streamifier = require('streamifier');

const parseMultipartForm = (req) => {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    let uploadedFile = null;

    bb.on('file', (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        uploadedFile = {
          filename,
          encoding,
          mimeType,
          buffer: Buffer.concat(chunks)
        };
      });
    });

    bb.on('finish', () => resolve(uploadedFile));
    bb.on('error', (err) => reject(err));

    req.pipe(bb);
  });
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    await connectDB();
    const user = await protect(req);
    authorize(user, 'Admin');

    const quizId = req.query.quizId;
    if (!quizId) {
      return res.status(400).json({ success: false, error: 'quizId is required' });
    }

    const file = await parseMultipartForm(req);

    if (!file) {
      return res.status(400).json({ success: false, error: 'Please upload a file' });
    }

    const questions = [];
    const filename = file.filename.toLowerCase();
    
    if (filename.endsWith('.csv')) {
      await new Promise((resolve, reject) => {
        streamifier.createReadStream(file.buffer)
          .pipe(csv())
          .on('data', (row) => {
            questions.push({
              quiz: quizId,
              text: row.Question || row.text,
              imageUrl: row['Image URL'] || row.ImageURL || row.Image || null,
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
          .on('end', resolve)
          .on('error', reject);
      });
      
      await Question.insertMany(questions);
      return res.status(201).json({ success: true, count: questions.length, data: 'Questions uploaded successfully' });
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      data.forEach((row) => {
        questions.push({
          quiz: quizId,
          text: row.Question || row.text,
          imageUrl: row['Image URL'] || row.ImageURL || row.Image || null,
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
    return res.status(400).json({ success: false, error: err.message });
  }
};

module.exports = handler;
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
