const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    // Check if the URI is a placeholder (i.e. contains <db_password>)
    if (!mongoUri || mongoUri.includes('<db_password>')) {
      console.warn('⚠️ WARNING: Using fallback In-Memory MongoDB Server because the MONGO_URI is missing or contains the <db_password> placeholder. Data will be lost on restart!');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
