import express from 'express';
import userRouter from './userRouter';
import apiRouter from './apiRouter';
import pieceRouter from './pieceRouter';
import shopRouter from './shopRouter';
import commentRouter from './commentRouter';
import authRouter from './auth';

const router = express.Router();
router.use("/user", userRouter);
router.use("/api", apiRouter);
router.use("/piece", pieceRouter);
router.use("/shop", shopRouter);
router.use("/comment", commentRouter);

router.use('/auth', authRouter);

export { router as default };