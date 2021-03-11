import Piece from "../models/Piece";
import Comment from "../models/Comment";
import User from "../models/User";
import { checkInclude, docToJSON } from "./apiController";
import util from "../modules/util";
import statusCode from "../modules/statusCode";
import responseMessage from "../modules/responseMessage";

export const getPieceDetail = async (req, res) => {
  const {
    params: { id },
  } = req;
  try {
    const piece = await Piece.findOne({ _id: id }).populate({
      path: "author",
      select: "userId imageUrl",
    });
    if (!piece) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, '존재하지 않는 작품 아이디입니다.'));
    } else {
      let obj = piece.toObject();
  
      obj = await Comment.populate(obj, {
        path: "comments",
        select: "user content comments created",
      });
      let commentsInfo = await User.populate(obj.comments, {
        path: "user",
        select: "imageUrl userId userName",
      });
      if (req.decoded) {
        obj.isMyPiece = piece.author._id == req.decoded._id;
        obj.login = true;
      } else {
        obj.isMyPiece = false;
        obj.login = false;
      }
      obj.comments = commentsInfo;
      obj.likeByUser = checkInclude(piece.like, req);
      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, '작품 조회 성공', obj));
    }
  } catch (err) {
    console.log(err);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};
