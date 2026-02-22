/**
 * Database Connection
 * 
 * This file connects our app to MongoDB Atlas.
 * Mongoose is a library that makes MongoDB easier to use in Node.js.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Connect to MongoDB using the URL from .env file
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected: ' + conn.connection.host);
    } catch (error) {
        console.error('MongoDB Connection Error: ' + error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
