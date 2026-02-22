/**
 * Database Connection Configuration
 * ==================================
 * 
 * WHAT THIS FILE DOES:
 * This file handles connecting our Express server to MongoDB Atlas.
 * 
 * KEY CONCEPTS:
 * 1. Mongoose - A library that makes it easy to work with MongoDB in Node.js
 * 2. Connection String - The URL that tells our app where the database is
 * 3. Async/Await - Modern way to handle operations that take time (like connecting to a database)
 */

const mongoose = require('mongoose');

/**
 * connectDB - Connects to MongoDB Atlas
 * 
 * This is an async function because connecting to a database takes time.
 * We use try/catch to handle any errors that might occur.
 */
const connectDB = async () => {
    try {
        // mongoose.connect() returns a promise
        // We await it to pause execution until connection is established
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        // If successful, log a confirmation message
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // If connection fails, log the error and exit the application
        console.error('MongoDB Connection Error: Failed to connect');
        process.exit(1); // Exit with failure code
    }
};

// Export the function so other files can use it
module.exports = connectDB;
