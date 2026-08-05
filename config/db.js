const mongoose = require("mongoose");
const env = require("./env");
const logger = require("./logger");

const connectDB = async () => {
    try {
        await mongoose.connect(env.MONGODB_URI);
        logger.info("✅ MongoDB Connected Successfully");
    } catch (error) {
        logger.error(`❌ MongoDB Connection Failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;