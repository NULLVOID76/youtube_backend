
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const  connectDB = async () => {
  try {
    const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`\nMongoDB connected !! DB HOST ${connection.connection.host}`);
  } catch (error) {
    console.error("ERROR :: in MongoDB connection", error);
    process.exit(1);
  }
};

export default connectDB;

