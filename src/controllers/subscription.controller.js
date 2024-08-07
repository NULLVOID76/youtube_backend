import mongoose, { isValidObjectId, mongo } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  try {
    if (!channelId.trim()) throw new ApiError(404, "Channel not found");
    const channel = await User.findById(channelId);
    if (!channel) throw new ApiError(404, "channel not found");
    // console.log(channelId, req?.user?.id);

    const subscription = await Subscription.aggregate([
      {
        $match: {
          subcriber: new mongoose.Types.ObjectId(req?.user?.id),
        },
      },
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId),
        },
      },
    ]);
    if (!subscription.length) {
      const subcribe = await Subscription.create({
        channel: channelId,
        subcriber: req?.user?.id,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, subcribe, "successfully Subcribed"));
    } else {
      const subcribe = await Subscription.findByIdAndDelete(
        subscription[0]._id
      );
      return res
        .status(200)
        .json(new ApiResponse(200, subcribe, "successfully Unsubcribed"));
    }
  } catch (error) {
    throw new ApiError(400, error || "error during Subcription changing");
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // console.log(channelId);

  try {
    if (!channelId.trim()) throw new ApiError(404, "channel not found");
    const channel = await User.findById(channelId);
    if (!channel) throw new ApiError(404, "channel not found");
    const subcription = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subcriber",
          foreignField: "_id",
          as: "subcriber",
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
        $project: {
          subcriber: 1,
        },
      },
      {
        $addFields: {
          subcriber: {
            $first: "$subcriber",
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, subcription, "All Subcriber Fetched"));
  } catch (error) {
    throw new ApiError(400, error || "error while fetching subcriber");
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  try {
    if (!userId) throw new ApiError(404, "User not found");
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    const subcription = await Subscription.aggregate([
      {
        $match: {
          subcriber: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "channel",
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
        $project: {
          channel: 1,
        },
      },
      {
        $addFields: {
          channel: {
            $first: "$channel",
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, subcription, "All Channel Fetched"));
  } catch (error) {
    throw new ApiError(400, error || "error while fetching subcriber");
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
