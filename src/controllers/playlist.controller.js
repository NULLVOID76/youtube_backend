import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  try {
    if (!name || !description)
      throw new ApiError(403, "Name and Description is requried");
    const playlist = await Playlist.create({
      name,
      description,
      owner: req.user?._id,
    });
    if (!playlist) throw new ApiError(503, "playlist is not created");
    return res.status(201).json(201, playlist, "playlist is created");
  } catch (error) {
    throw new ApiError(503, error || "error while creating playlist ");
  }
  //TODO: create playlist
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  try {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "Invalid User");
    const playlists = await Playlist.aggregate([
      {
        $match: {
          owner: userId,
        },
      },
    ]);
    return res
      .status(201)
      .json(new ApiResponse(201, playlists, "all Playlist is fetched"));
  } catch (error) {
    throw new ApiError(502, error || "error while getting Playlist ");
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Invalid playlist id");
    return res
      .status(201)
      .json(new ApiResponse(201, playlist, "playlist is fetched"));
  } catch (error) {
    throw new ApiError(503, error || "error while fecthing playlist");
  }
  //TODO: get playlist by id
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  try {
    const playlist = await Playlist.findByIdAndUpdate(playlistId, {
      $push: {
        video: videoId,
      },
    });
    if (!playlist.video.includes(videoId))
      throw new ApiError(503, "video is not includes");
    return res
      .status(201)
      .json(new ApiResponse(201, playlist, "Video is added"));
  } catch (error) {
    throw new ApiError(503, error || "error while adding video in playlist");
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  try {
    const playlist = await Playlist.findByIdAndUpdate(playlistId, {
      $pull: {
        video: videoId,
      },
    });
    if (playlist.video.includes(videoId))
      throw new ApiError(503, "video is not removed");
    return res
      .status(201)
      .json(new ApiResponse(201, playlist, "Video is deleted"));
  } catch (error) {
    throw new ApiError(503, error || "error while deleting video in playlist");
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  try {
    const playlist = await Playlist.findByIdAndDelete(playlistId);
    if (!playlist) throw new ApiError(404, "invalid Playlist id");
    return res
      .status(201)
      .json(new ApiResponse(201, playlist, "Playlist is deleted"));
  } catch (error) {
    throw new ApiError(505, error || "error while deleting playlist");
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  try {
    if (!name || !description)
      throw new ApiError(403, "Name and Description is requried");
    const playlist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $set: {
          name,
          description,
        },
      },
      {
        new: true,
      }
    );
    if (!playlist) throw new ApiError(404, "invalid Playlist id");
    return res
      .status(201)
      .json(new ApiResponse(201, playlist, "playlist is updated"));
  } catch (error) {
    throw new ApiError(502, error || "error while updating video");
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
