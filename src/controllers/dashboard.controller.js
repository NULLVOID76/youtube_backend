import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const userId = req.user?._id;
  try {
    const subscribers = await Subscription.find({ channel: userId });
    const videos = await Video.find({ owner: userId });
    // console.log(videos.length);
    //abhi complete krna he
    
    return res
      .status(200)
      .json(new ApiResponse(200, { subscribers:subscribers.length, videos:videos.length }, "Channel Stats"));
  } catch (error) {
    throw new ApiError(501, error || "error while getting stats");
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const userId = req.user?._id;
  const { page = 1, limit = 10 } = req.query;
  try {
    const videos = await Video.aggregatePaginate(
      Video.aggregate([
        {
          $match: {
            owner: userId,
          },
        },
        {
          $project: {
            thumbnail: 1,
            title: 1,
            views: 1,
            isPublished: 1,
          },
        },
      ]),
      { page, limit }
    );
    return res
      .status(201)
      .json(new ApiResponse(201, videos, "All videoes fetched"));
  } catch (error) {
    throw new ApiError(504, error || "error while fecthing videos");
  }
});

export { getChannelStats, getChannelVideos };
