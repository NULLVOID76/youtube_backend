import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudniary,
} from "../utils/clouninary.js";
import { upload } from "../middlewares/multer.middleware.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  console.log(userId);

  try {
    // const videos = await Video.aggregate([
    //   {
    //     $match: {
    //       owner: new mongoose.Types.ObjectId(userId),
    //     },
    //   },
    // ]);
    // const myAggregate = ;
    const video = await Video.aggregatePaginate(
      Video.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId),
          },
        },
      ]),
      { page, limit, query } // complete the options
    );
    return res
      .status(200)
      .json(new ApiResponse(200, video, "video is fetched"));
  } catch (error) {
    throw new ApiError(404, error || "videos not found");
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished = true } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title) throw new ApiError(404, "title is requried");
  if (!description) throw new ApiError(404, "description is requried");
  let videoLocalPath;
  if (!req.files?.videoFile) throw new ApiError(400, "Video is requried");
  else videoLocalPath = req.files.videoFile[0].path;

  let thumbnailLocalPath;
  if (!req.files?.thumbnail) throw new ApiError(400, "thumbnail is requried");
  else thumbnailLocalPath = req.files.thumbnail[0].path;

  const videoCloudPath = await uploadOnCloudinary(videoLocalPath);
  const thumbnailCloudPath = await uploadOnCloudinary(thumbnailLocalPath);
  if (!videoCloudPath) throw new ApiError(400, "video us requried");
  if (!thumbnailCloudPath) throw new ApiError(400, "thumbnail is requried");

  const video = await Video.create({
    title,
    description,
    vidoeFile: videoCloudPath?.url,
    thumbnail: thumbnailCloudPath?.url,
    duration: videoCloudPath?.duration,
    isPublished,
    owner: req.user._id,
  });

  if (!video) throw new ApiError(500, "Error while uploading Video");

  return res.status(201).json(new ApiResponse(201, video, "Video is uploaded"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId.trim()) throw new ApiError(400, "Not valid video id");
  console.log(videoId);

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            //also add subcriber count
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
  ]);

  if (!video.length) throw new ApiError(404, "video not found");

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "video is fetched"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  try {
    if (!videoId.trim()) throw new ApiError(404, "Invalid videoId");
    const video = await Video.findById(videoId);

    const { title, description } = req.body;
    const thumbnailLocalPath = req?.file?.path;
    const thumbnailCloudPath = await uploadOnCloudinary(thumbnailLocalPath);

    if (!title && !description && !thumbnailCloudPath)
      throw new ApiError(400, "Atleast one Field is Required");
    if (thumbnailCloudPath) await deleteFromCloudniary(video.thumbnail);

    video.title = title ? title : video.title;
    video.description = description ? description : video.description;
    video.thumbnail = thumbnailCloudPath
      ? thumbnailCloudPath?.url
      : video.thumbnail;

    await video.save({ validBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, video, "video is updated"));
  } catch (error) {
    throw new ApiError(400, error || "error in updateing");
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  try {
    if (!videoId.trim()) throw new ApiError(400, "Not valid video id");

    const video = await Video.findByIdAndDelete(videoId);
    if (!video) throw new ApiError(404, "video not found");
    await deleteFromCloudniary(video.vidoeFile);
    await deleteFromCloudniary(video.thumbnail);
    return res
      .status(200)
      .json(new ApiResponse(200, video, "video is deleted"));
  } catch (error) {
    throw new ApiError(404, error || "vieo not found");
  }
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId.trim()) throw new ApiError(400, "Not valid video id");
  let video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "video not found");
  video.isPublished = !video.isPublished;
  await video.save({ alidBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, video, "video status is toggled"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
