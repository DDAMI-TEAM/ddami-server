import express from "express";
import { getPieceDetail } from "../controllers/pieceController";
import { jwtMiddleware, checkViewUser } from "../jwtMiddleware";

const pieceRouter = express.Router();

pieceRouter.get("/detail/:id", jwtMiddleware, checkViewUser, getPieceDetail);
// pieceRouter.post("/detail/:id", jwtMiddleware, checkViewUser, getPieceDetail);
export default pieceRouter;
