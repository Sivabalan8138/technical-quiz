const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const connectDB = require('./src/config/db');

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();
    
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@techquiz.com' });
    
    if (adminExists) {
      console.log('Admin user already exists! Email: admin@techquiz.com');
      process.exit();
    }

    await User.create({
      name: 'Super Admin',
      email: 'admin@techquiz.com',
      password: 'password123',
      role: 'Admin'
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@techquiz.com');
    console.log('Password: password123');
    process.exit();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
