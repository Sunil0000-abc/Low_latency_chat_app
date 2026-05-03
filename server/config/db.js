import mongoose from 'mongoose'

export async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongodb connected");
        return mongoose.connection.db;
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    }
}