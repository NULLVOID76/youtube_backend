import { Router } from "express";
import { regitsterUser } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.route("/register").post(regitsterUser)
// userRouter.route("/login").post(loginUser)

export default userRouter;
