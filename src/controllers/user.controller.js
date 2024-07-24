import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/clouninary.js";

const regitsterUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  const { fullname, username, email, password } = req.body;
  /*console.log(fullname,password);*/

  // validation
  if (fullname === "") {
    throw new ApiError(400, "Fullname is required");
  }
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Field is required");
  }

  //check if user already exixts
  const exixtedUser = User.findOne({ $or: [{ username }, { email }] });

  if (exixtedUser)
    throw new ApiError(409, "User with email or username exited");

  //check for images,check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required");

  //upload them to cloudinary, avatar check
  const avatarCloudPath = await uploadOnCloudinary(avatarLocalPath).url;
  const coverImageCloudPath =
    (await uploadOnCloudinary(coverImageLocalPath)?.url) || "";
  if (avatarCloudPath) throw new ApiError(400, "Avatr file is required");

  // create user object- create entry in db
  const user = await User.create({
    fullname, // ES6 key value equal he isliye esa likha he
    avatar: avatarCloudPath,
    coverImage: coverImageCloudPath,
    email,
    password,
    username: usernma.toLowerCase(),
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
