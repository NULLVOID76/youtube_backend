import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  try {
    if (!videoId.trim()) throw new ApiError(404, "Invalid Video Id");
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Invalid Video Id");
    const likedVideo = await Like.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
    ]);
    if (!likedVideo.length) {
      const likeVideo = await Like.create({
        video: videoId,
        likedBy: req.user?._id,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, likeVideo, "Video is Liked"));
    } else {
      const likeVideo = await Like.findByIdAndDelete(likedVideo[0]._id);
      return res
        .status(200)
        .json(new ApiResponse(200, likeVideo, "Video is Unliked"));
    }
  } catch (error) {
    throw new ApiError(404, error || "error while likeing a video");
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  try {
    if (!commentId.trim()) throw new ApiError(404, "Invalid Comment Id");
    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Invalid comment Id");
    const likedComment = await Like.aggregate([
      {
        $match: {
          comment: new mongoose.Types.ObjectId(commentId),
        },
      },
    ]);
    if (!likedComment.length) {
      const likeComment = await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, likeComment, "Comment is Liked"));
    } else {
      const likeComment = await Like.findByIdAndDelete(likedComment[0]._id);
      return res
        .status(200)
        .json(new ApiResponse(200, likeComment, "Comment is Unliked"));
    }
  } catch (error) {
    throw new ApiError(404, error || "error while likeing a Comment");
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  try {
    if (!tweetId.trim()) throw new ApiError(404, "Invalid Tweet Id");
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Invalid tweet Id");
    const likedTweet = await Like.aggregate([
      {
        $match: {
          tweet: new mongoose.Types.ObjectId(tweetId),
        },
      },
    ]);
    if (!likedTweet.length) {
      const likeTweet = await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, likeTweet, "Tweet is Liked"));
    } else {
      const likeTweet = await Like.findByIdAndDelete(likedTweet[0]._id);
      return res
        .status(200)
        .json(new ApiResponse(200, likeTweet, "Tweet is Unliked"));
    }
  } catch (error) {
    throw new ApiError(404, error || "error while likeing a Tweet");
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user?._id;
  console.log(userId);

  try {
    const likedVideoes = await Like.aggregate([
      {
        $match: {
          likedBy: userId,
        },
      },
      {
        $lookup: {
          from: "videos",
          foreignField: "_id",
          localField: "video",
          as: "video",
        },
      },
    ]);
    return res
      .status(201)
      .json(new ApiResponse(201, likedVideoes, "All Liked Videoes is fecthed"));
  } catch (error) {
    throw new ApiError(404, error || "error while fecthing liked videoes");
  }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
