import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error(
      "MONGODB_URI is not defined in .env"
    );
  }

  try {
    await mongoose.connect(mongoURI);

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error(
      "❌ MongoDB connection failed:",
      error
    );

    process.exit(1);
  }
}