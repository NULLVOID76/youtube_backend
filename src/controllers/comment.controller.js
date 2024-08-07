import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  try {
    if (!videoId.trim()) throw new ApiError(404, "Invalid Video id");
    const comments = await Comment.aggregatePaginate(
      Comment.aggregate([
        {
          $match: {
            video: new mongoose.Types.ObjectId(videoId),
          },
        },
        // complete it{}
      ]),
      { page, limit }
    );
    return res
      .status(200)
      .json(new ApiResponse(200, comments, "Comments is fetched"));
  } catch (error) {
    throw new ApiError(404, error || "error while fecthing comments");
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  try {
    const { comment } = req.body;
    const { videoId } = req.params;
    if (!videoId.trim()) throw new ApiError(404, "Invalid Video id");
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Invalid Video id");
    if (!comment) throw new ApiError(402, "Comment is Requrired");
    const createdComment = await Comment.create({
      content: comment,
      video: videoId,
      owner: req.user?._id,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, createdComment, "comment is created"));
  } catch (error) {
    throw new ApiError(402, error || "error during creating comment");
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { comment } = req.body;
  try {
    if (!commentId.trim()) throw new ApiError(404, "Invalid Comment Id");
    if (!comment) throw new ApiError(402, "comment can't be empty");

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $set: {
          content: comment,
        },
      },
      {
        new: true,
      }
    );
    if(!updatedComment) throw new ApiError(404,"Invalid comment Id");    
    return res
      .status(202)
      .json(new ApiResponse(202, updatedComment, "Comment is updated"));
  } catch (error) {
    throw new ApiError(402, error || "error while updating comment");
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;

  try {
    if (!commentId.trim()) throw new ApiError(404, "Invalid Comment Id");
    const deletedComment = await Comment.findByIdAndDelete(commentId);
    
    if(!deletedComment) throw new ApiError(404,"Invalid comment Id");
    
    return res
      .status(202)
      .json(
        new ApiResponse(202, deletedComment, "Comment deleted suceesfully")
      );
  } catch (error) {
    throw new ApiError(404, error || "Error while deleting Comment");
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
