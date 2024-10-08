import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearrer ", "");
    //   console.log(token);
    if (!token) throw new ApiError(401, "Unauthorized Requestsss");
    const decodedToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );
    // console.log(decodedToken);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
  
    if (!user) throw new ApiError(401, "Invalid Acess Token");
    req.user = user;
    // console.log(new mongoose.Types.ObjectId(req.user._id));
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Acess Token");
  }
});
