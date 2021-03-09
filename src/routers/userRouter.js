import express from "express";
import {
  postJoin,
  postLogin,
  postUpload,
  getUserDetail,
  addLike,
  checkUserId,
  postAuth,
  postMyPieces,
  authStudent,
  getMyInfo,
  putMyInfo,
  getLikePieces,
  getLikeProducts,
  addLikeProduct,
  putFollow,
  postUploadComment,
  getAtelier,
  getFollow,
  getFollower
} from "../controllers/userController";

import { multerImage } from "../multerMiddleware";
import { jwtMiddleware } from "../jwtMiddleware";
const userRouter = express.Router();

userRouter.post("/join", postJoin);
userRouter.post("/login", jwtMiddleware, postLogin);


userRouter.post("/write/comment/:id", postUploadComment);
userRouter.post(
  "/upload/piece",
  jwtMiddleware,
  multerImage.array("img", 3),
  postUpload
);
userRouter.post("/like/piece/:pieceId", jwtMiddleware, addLike);
// userRouter.get("/like/piece/:id", jwtMiddleware, addLike);
// userRouter.get("/follow/:id", jwtMiddleware, addFollow);


userRouter.post("/like/product/:id", jwtMiddleware, addLikeProduct);
userRouter.post("/checkId", checkUserId);
userRouter.post("/auth", jwtMiddleware, postAuth);
userRouter.post("/mypieces", jwtMiddleware, postMyPieces);

// userRouter.get("/detail/:id", jwtMiddleware, getUserDetail); // 원래 작업실 정보 가져다주는 api
userRouter.get("/atelier/:id", jwtMiddleware, getAtelier); // 작업실 정보 가져다 주기.
userRouter.get("/myInfo", jwtMiddleware, getMyInfo);
userRouter.put("/myInfo", jwtMiddleware, multerImage.single("img"), putMyInfo); //프로필 수정
userRouter.put("/:userId/follow", jwtMiddleware, putFollow); //팔로우 수정

userRouter.get('/:userId/following', getFollow);
userRouter.get('/:userId/follower', getFollower);
userRouter.get("/like/pieces", jwtMiddleware, getLikePieces);
userRouter.get("/like/products", jwtMiddleware, getLikeProducts);
// 미대생 인증
userRouter.post( "/auth/student",
  jwtMiddleware,
  multerImage.single("img"),
  authStudent
);

export default userRouter;