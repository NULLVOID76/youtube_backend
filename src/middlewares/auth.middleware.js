import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js"

 export const verifyJWT = asyncHandler(async (req,res,next) => {
    try {
        const token=req.cookes?.accesToken || req.header("Authorization")?.replace("Bearrer ","")
        if(!token) throw new ApiError(401,"Unauthorized Request");
        const decodedToken=await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user=User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user) throw new ApiError(401,"Invalid Acess Token")
            req.user=user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.meddage|| "Invalid Acess Token")
    }
});