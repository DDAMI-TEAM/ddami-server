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
  const piece = await Piece.findOne({ _id: id }).populate({
    path: "author",
    select: "userId imageUrl",
  });
  if (!piece) {
    return res
      .status(statusCode.NOT_FOUND)
      .send(util.fail(statusCode.NOT_FOUND, responseMessage.READ_POST_FAIL));
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

    obj.comments = commentsInfo;
    obj.likeByUser = checkInclude(piece.like, req);
    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_POST_SUCCESS, obj));
  }
};
