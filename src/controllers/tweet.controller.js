import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { tweet } = req.body;
  try {
    if (!tweet.trim()) throw new ApiError(403, "tweet can't be empty");
    const createdTweet = await Tweet.create({
      content: tweet,
      owner: req.user?._id,
    });
    if (!createdTweet) throw new ApiError(502, "Tweet is not created");
    return res
      .status(201)
      .json(new ApiResponse(201, createdTweet, "Tweet is created"));
  } catch (error) {
    throw new ApiError(501, error || "error while creating tweet");
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  try {
    const tweets = await Tweet.aggregate([
      {
        $match: {
          owner: userId,
        },
      },
    ]);
    return res
      .status(204)
      .json(new ApiResponse(204, tweets, "All tweets fetched"));
  } catch (error) {
    throw new ApiError(5000000, error || "error while geting tweets");
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweet } = req.body;
  const { tweetId } = req.params;
  try {
    if (!tweet.trim()) throw new ApiError(403, "tweet can't be empty");
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
      $set: {
        content: tweet,
      },
    });
    if (!updatedTweet) throw new ApiError(404, "Tweet is not Updated");
    return res
      .status(201)
      .json(new ApiResponse(201, updatedTweet, "Invalid Tweet Id"));
  } catch (error) {
    throw new ApiError(501, error || "error while Updating tweet");
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  try {
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    if (!deletedTweet) throw new ApiError(404, "Invalid Tweet Id");
    return res.status(201).json(201, deletedTweet, "Tweet is deleted");
  } catch (error) {
    throw new ApiError(501, "Error while deleting Tweet");
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
