import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const subcriptionRouter = Router();
subcriptionRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

subcriptionRouter
  .route("/c/:channelId")
  .get(getUserChannelSubscribers)
  .post(toggleSubscription);

subcriptionRouter.route("/u/subcribed").get(getSubscribedChannels);

export default subcriptionRouter;
