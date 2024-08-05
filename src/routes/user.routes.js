import { Router } from "express";
import {
  regitsterUser,
  loginUser,
  logoutUser,
  refreshAcessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
  deleteUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import multer from "multer";

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  regitsterUser
);
userRouter.route("/login").post(loginUser);

//secured route
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refresh-token").post(refreshAcessToken);
userRouter.route("/change-password").post(verifyJWT, changeCurrentPassword);
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);
userRouter.route("/update-account").patch(verifyJWT, updateAccountDetails);
userRouter.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
userRouter.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
userRouter.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
userRouter.route("/history").get(verifyJWT, getUserWatchHistory);
userRouter.route("/delete").delete(verifyJWT,deleteUser);


export default userRouter;
