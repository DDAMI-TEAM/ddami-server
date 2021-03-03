import express from "express";
import {
  postJoin,
  postLogin,
  postUpload,
  postUserDetail,
  addLike,
  checkUserId,
  postAuth,
  postMyPieces,
  authStudent,
  postMyInfo,
  postMyLikes,
  postLikeProducts,
  addLikeProduct,
  addFollow,
  postUploadComment,
} from "../controllers/userController";

import { multerImage } from "../multerMiddleware";
import { jwtMiddleware } from "../jwtMiddleware";
const userRouter = express.Router();

userRouter.post("/join", postJoin);
userRouter.post("/login", jwtMiddleware, postLogin);
userRouter.post("/detail/:id", postUserDetail);
userRouter.get("/detail/:id", postUserDetail);
userRouter.post("/write/comment/:id", postUploadComment);
userRouter.post(
  "/upload/piece",
  jwtMiddleware,
  multerImage.array("img", 3),
  postUpload
);
userRouter.post("/like/piece/:id", jwtMiddleware, addLike);
userRouter.get("/like/piece/:id", jwtMiddleware, addLike);
userRouter.get("/follow/:id", jwtMiddleware, addFollow);
userRouter.post("/follow/:id", jwtMiddleware, addFollow);
userRouter.post("/like/product/:id", jwtMiddleware, addLikeProduct);
userRouter.post("/checkId", checkUserId);
userRouter.post("/auth", jwtMiddleware, postAuth);
userRouter.post("/mypieces", jwtMiddleware, postMyPieces);
userRouter.post("/myInfo", jwtMiddleware, postMyInfo);
userRouter.post("/mylikes", jwtMiddleware, postMyLikes);
userRouter.post("/like/products", jwtMiddleware, postLikeProducts);
// 미대생 인증
userRouter.post( "/auth/student",
  jwtMiddleware,
  multerImage.single("img"),
  authStudent
);

export default userRouter;
