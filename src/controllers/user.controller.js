import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/clouninary.js";
import jwt from "jsonwebtoken";

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
  console.log(req.body, req.files);

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
  console.log(username, email, password);
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
  const options = {
    httpOnly: true,
    secure: true,
  };
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
      $set: { refreshToken: "" },
    },
    { new: true }
  );

  // clear cookies
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json("user succcessfully logout");
});

const refreshAcessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
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
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } = await genrateAccessAndRefreshTokens(
      user._id
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", newRefreshToken)
      .json(
        new ApiResponse(
          200,
          { accesToken, newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
      throw new ApiError(401,error?.message||"Invalid refresh Token")
  }
});
export { regitsterUser, loginUser, logoutUser ,refreshAcessToken};
