const mongoose = require('mongoose');

let cachedDb = null;

const connectDB = async () => {
  if (cachedDb) {
    console.log('Using cached database instance');
    return cachedDb;
  }

  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri || mongoUri.includes('<db_password>')) {
      throw new Error('MONGO_URI is missing or contains the <db_password> placeholder.');
    }

    // Remove unsupported options from connection string if present
    let cleanMongoUri = mongoUri;
    try {
      const parsedUrl = new URL(mongoUri);
      for (const key of Array.from(parsedUrl.searchParams.keys())) {
        if (key.toLowerCase() === 'usenewurlparser' || key.toLowerCase() === 'useunifiedtopology') {
          parsedUrl.searchParams.delete(key);
        }
      }
      cleanMongoUri = parsedUrl.toString();
    } catch (err) {
      // ignore parsing errors and let mongoose throw if invalid
    }

    const conn = await mongoose.connect(cleanMongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    cachedDb = conn;
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
