import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudniary,
} from "../utils/clouninary.js";
import jwt from "jsonwebtoken";

const options = {
  httpOnly: true,
  secure: true,
};

const genrateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.genrateAccessToken();
    const refreshToken = await user.genrateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error while Gnerating Token");
  }
};

const regitsterUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  const { fullName, username, email, password } = req.body;
  /*console.log(fullName,password);*/
  // console.log(req.body, req.files);

  // validation
  if (fullName === "") {
    throw new ApiError(400, "fullName is required");
  }
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Field is required");
  }

  //check if user already exixts
  const exixtedUser = await User.findOne({ $or: [{ username }, { email }] });

  if (exixtedUser)
    throw new ApiError(409, "User with email or username exited");

  //check for images,check for avatar
  let avatarLocalPath;

  if (req.files?.avatar) avatarLocalPath = req.files?.avatar[0]?.path;
  else throw new ApiError(400, "avatar is rquried");

  const coverImageLocalPath = req.files?.coverImage
    ? req.files?.coverImage[0]?.path
    : "";

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required");

  //upload them to cloudinary, avatar check
  const avatarCloudPath = await uploadOnCloudinary(avatarLocalPath);
  const coverImageCloudPath = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarCloudPath) throw new ApiError(400, "Avatar file is required");

  // create user object- create entry in db
  const user = await User.create({
    fullName, // ES6 key value equal he isliye esa likha he
    avatar: avatarCloudPath.url,
    coverImage: coverImageCloudPath?.url || "",
    email,
    password,
    username: username?.toLowerCase(),
  });
  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken "
  );

  //check for user creation
  if (!createdUser) throw new ApiError(500, "Error while registering the user");

  //return response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User Registred Sucessfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get deatils form frontend
  const { username, email, password } = req.body;
  // console.log(req.body,username, email, password);
  //validate data
  if (!(username || email))
    throw new ApiError(400, "username or email is required");
  //check in db
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) throw new ApiError(404, "User not extsi");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid user Credentials");

  //genrate access,refresh token
  const { accessToken, refreshToken } = await genrateAccessAndRefreshTokens(
    user._id
  );
  // remove xtra field
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken "
  );
  //send cookie

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "user logged In Sucessfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // clear refresh token
  await User.findByIdAndUpdate(
    req.user._id,
    {
      // $set: { refreshToken: "" },
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );

  // clear cookies

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user succcessfully logout"));
});

const refreshAcessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  // console.log(incomingRefreshToken);
  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");
  try {
    const decodedToken = await jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user) throw new ApiError(401, "Invalid Token");

    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, "Refresh token is expired or used");

    const { accessToken, refreshToken } = await genrateAccessAndRefreshTokens(
      user._id
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", refreshToken)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) throw new ApiError(400, "Invalid password");
  user.password = newPassword;
  await user.save({ validBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Change Succesfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName && !email)
    throw new ApiError(400, "Atleast one  field is required");
  const user = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, "Account details Updated Succesfully"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing ");
  const avatarCloudPath = await uploadOnCloudinary(avatarLocalPath);
  if (!avatarCloudPath.url)
    throw new ApiError(400, "Error while uploading on Avatar");
  await deleteFromCloudniary(req.user?.avatar);
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatarCloudPath?.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar update succesfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath)
    throw new ApiError(400, "Cover Image file is missing ");
  const coverImageCloudPath = await uploadOnCloudinary(coverImageLocalPath);
  // console.log(coverImageLocalPath,coverImageCloudPath.url);
  if (!coverImageCloudPath.url)
    throw new ApiError(400, "Error while uploading on Cover Image");
  await deleteFromCloudniary(req.user?.coverImage);
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImageCloudPath?.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image update succesfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) throw new ApiError(400, "username is missing");
  // User.find({username})
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subcribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subcriber",
        as: "subcribedTo",
      },
    },
    {
      $addFields: {
        subcribersCount: {
          $size: "$subcribers",
        },
        subcribedToCount: {
          $size: "$subcribedTo",
        },
        isSubcribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subcribers.subcriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        subcribersCount: 1,
        subcribedToCount: 1,
        isSubcribed: 1,
      },
    },
  ]);

  if (!channel?.length) throw new ApiError(404, "channel does not exists");

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: req.user?._id,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched successfully"
      )
    );
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = req.user;
  try {
    await deleteFromCloudniary(user.avatar);
    await deleteFromCloudniary(user.coverImage);
    const deletedUser = await User.findByIdAndDelete(user._id);
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, deletedUser, "user is deleted"));
  } catch (error) {
    throw new ApiError(400, error || "error in deleting");
  }
});

export {
  regitsterUser,
  loginUser,
  logoutUser,
  refreshAcessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
  deleteUser,
};
