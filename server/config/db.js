import mongoose from 'mongoose'

export async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongodb connected");
        return mongoose.connection.db; // Return the native db object
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
        process.exit(1); // Stop server if DB fails
    }
}