import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/clouninary.js";

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

export { regitsterUser };
