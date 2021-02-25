import User from "../models/User";
import Piece from "../models/Piece";
import Comment from "../models/Comment";
import Product from "../models/Product";
import Material from "../models/Material";
import Student from "../models/Student";
import jwt from "jsonwebtoken";
import responseMessage from "../modules/responseMessage"
import statusCode from "../modules/statusCode"
import util from "../modules/util"
import crypto from "crypto"
import dotenv from "dotenv";

dotenv.config();

const checkAndroid = (req) => {
  return req.headers["user-agent"].match(/Android/i) == null ? false : true;
};
export const checkUserId = async (req, res) => {
  const {
    body: { userId },
  } = req;
  if (!userId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  try {
    const user = await User.findOne({ userId });
    if (user === null) {
      return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, "사용 가능한 ID입니다."));
    } else {
      return res
      .status(statusCode.OK)
      .send(util.fail(statusCode.OK, responseMessage.ALREADY_ID));
    }
  } catch (err) {
    console.log(err);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};
export const postAuth = async (req, res) => {
  const user = await User.findById(req.decoded._id).select(
    "imageUrl userName state"
  );
  if (user === null)
    res.json({ result: 0, message: "없어진 계정이거나 없는 계정입니다." });
  else {
    if (user.state === true) {
      const student = await Student.findOne({ user: user._id }).select(
        "university department"
      );
      let obj = user.toObject();
      obj.student = student;

      res.json({ result: 1, myInfo: obj });
    } else {
      res.json({ result: 1, myInfo: user });
    }
  }
};

export const postJoin = async (req, res) => {
  const {
    body: {
      userId,
      userPassword,
      userName,
      userSex,
      userBirth,
      userPhone,
      likeField,
    },
  } = req;
  if (!userId || !userPassword || !userName || !userSex || !userBirth || !userPhone) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  try {
    const user = await User.findOne({ userId });
    if (user !== null) {
      return res
        .status(statusCode.OK)
        .send(util.fail(statusCode.OK, responseMessage.ALREADY_ID));
    } else {
      const salt = crypto.randomBytes(64).toString('base64');
      const hashedPassword = crypto.pbkdf2Sync(userPassword, salt, 10000, 64, 'sha512').toString('base64');
      const user = await User({
        userId,
        userPassword: hashedPassword,
        salt,
        userName,
        userSex,
        userBirth,
        userPhone,
        likeField,
      });
      await User.create(user);

      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.MEMBER_CREATE_SUCCESS));
    }
  } catch (error) {
    console.log(error);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};

export const postLogin = async (req, res) => {
  if (!req.decoded) {
    const { userId, userPassword, deviceToken } = req.body;
    if (!userId || !userPassword) {
      console.log('필요한 값이 없습니다.');
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
    }
    //SERCRET
    const secret = req.app.get("jwt-secret");
    try {
      const user = await User.findOne({ userId });
      if (user) {
        const salt = user.salt;
        const hashedPassword = crypto.pbkdf2Sync(userPassword, salt, 10000, 64, 'sha512').toString('base64');
        if (user.userId === userId && user.userPassword === hashedPassword) {
          //토큰 발급
          jwt.sign(
            {
              _id: user._id,
              userId: user.userId,
            },
            secret,
            {
              expiresIn: "7d", //만료기간
              issuer: "ddami.com",
              subject: "userInfo",
            },
            (err, token) => {
              if (!err) {
                console.log("로그인 성공");
                if (checkAndroid(req)) {
                  if (user.deviceToken) {
                    if (user.deviceToken !== deviceToken) {
                      user.deviceToken = deviceToken;
  
                      user.save((e) => {
                        if (!e) {
                          console.log("디바이스 토큰 변경 완료");
                        }
                      });
                    }
                  } else {
                    user.deviceToken = deviceToken;
                    user.save((e) => {
                      if (!e) {
                        console.log("디바이스 토큰 생성 완료");
                      }
                    });
                  }
                }
                const data = {};
                data.token = token;
                return res
                  .status(statusCode.OK)
                  .send(util.success(statusCode.OK, `${userId}로 로그인 성공`, data));
              }
            }
          );
        } else {
          return res
            .status(statusCode.OK)
            .send(util.fail(statusCode.OK, responseMessage.MISS_MATCH_PW));
        }
      }
      return res
      .status(statusCode.OK)
      .send(util.fail(statusCode.oK, "존재하지 않는 ID입니다."));
    } catch (err) {
      console.log(err)
      return res
        .status(statusCode.INTERNAL_SERVER_ERROR)
        .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    }
  } else {
    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, `${req.decoded.userId}로 자동로그인 성공`));
  }
};

export const postUpload = async (req, res) => {
  console.log(req);
  const {
    body: { title, description, hasField },
  } = req;
  try {
    const user = await User.findOne({ userId: req.decoded.userId });
    const fileUrl = [];
    if (req.files) {
      for (var e of req.files)
        fileUrl.push(`${process.env.BASE_URL}/uploads/${e.filename}`);
    }
    const piece = await Piece({
      fileUrl,
      title,
      description,
      hasField,
      author: user._id,
    });
    piece.save((err) => {
      if (!err) {
        user.myPieces.push(piece._id);
        user.save((err) => {
          if (err) res.json({ result: 0, message: "db error" });
        });
        res
          .status(201)
          .json({ result: 1, message: "성공적으로 업로드 했습니다." });
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ result: 0, message: "db오류" });
  }
};

export const postUserDetail = async (req, res) => {
  const {
    params: { id },
  } = req;
  const user = await User.findById(id)
    .select(
      "userName userId follow followerCount likeField state imageUrl stateMessage"
    )
    .populate({
      path: "myPieces",
      select: "fileUrl title description like likeCount views",
    });
  if (user === null) {
    res.json({ result: 0, message: "사라진 사용자입니다." });
  } else {
    let obj = user.toObject();
    if (user.state === true) {
      const student = await Student.findOne({ user: user._id }).select(
        "university department"
      );
      obj.student = student;
    }
    //닉네임 팔로워수
    obj.follow = user.follow.length;
    obj.myPieces.reverse();

    console.log(obj);
    res.json({ result: 0, user: obj });
  }
};

export const addLike = async (req, res) => {
  console.log(req);
  const {
    params: { id },
  } = req;
  const piece = await Piece.findOne({ _id: id });
  if (piece == null)
    res.status(404).json({ result: 0, message: "사라지거나 없는 작품입니다." });
  else {
    try {
      const user = await User.findById(req.decoded._id);
      const pos = user.like.indexOf(id);

      if (pos != -1) {
        piece.like.splice(piece.like.indexOf(req.decoded._id), 1);
        piece.likeCount--;
        piece.save((err) => {
          if (err) {
          }
          user.like.splice(pos, 1);
          user.save();
        });
        res.json({ result: 1, message: "좋아요 취소" });
      } else {
        piece.like.push(req.decoded._id);
        piece.likeCount++;
        piece.save((err) => {
          if (err) {
          }
          user.like.push(id);
          user.save();
        });
        res.json({ result: 1, message: "좋아요 성공" });
      }
    } catch (err) {
      res.status(500).json({ result: 0, message: "DB 오류" });
    }
  }
};

export const postMyPieces = async (req, res) => {
  const user = await User.findById(req.decoded._id)
    .select("myPieces")
    .populate({ path: "myPieces", select: "fileUrl state" });
  if (user === null)
    res.json({ result: 0, message: "없어진 계정이거나 없는 계정입니다." });
  else {
    res.json({ result: 1, mypieces: user.myPieces });
  }
};

export const authStudent = async (req, res) => {
  let {
    body: { university, department, number, likeField },
  } = req;
  const user = await User.findById(req.decoded._id);
  if (user === null) {
  } else if (user.state === true)
    res.json({ result: 0, message: "이미 인증된 사용자입니다." });
  else {
    try {
      if (!likeField) likeField = [];
      const student = await Student({
        user: req.decoded._id,
        university,
        department,
        number,
        authImage: req.file
          ? `${process.env.BASE_URL}/uploads/${req.file.filename}`
          : "",
      });
      await Student.create(student);

      user.state = true;
      user.likeField = likeField;
      // user.likeField.concat(
      //   likeField.filter((e) => user.likeField.indexOf(e) == -1)
      // );
      console.log(user);
      await user.save((err) => {
        if (!err) res.json({ result: 1, message: "미대생 인증 되었습니다." });
        else {
          console.log(err);
          res.json({ result: 0, message: "DB 오류" });
        }
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ result: 0, message: "DB 오류" });
    }
  }
};

export const postMyInfo = async (req, res) => {
  const user = await User.findById(req.decoded._id)
    .select(
      "userId userName imageUrl myPieces likeField follow followerCount state"
    )
    .populate({ path: "myPieces", select: "fileUrl" });
  if (user === null)
    res.json({ result: 0, message: "없어진 계정이거나 없는 계정입니다." });
  else {
    let obj = user.toObject();
    obj.follow = obj.follow.length;
    const student = await Student.findOne({ user: user._id }).select(
      "university department"
    );
    if (student === null) res.json({ result: 1, mypieces: user.myPieces });
    else {
      obj.student = student.toObject();
      res.json({ result: 1, myInfo: obj });
    }
  }
};

export const postMyLikes = async (req, res) => {
  const user = await User.findById(req.decoded._id)
    .select("like")
    .populate({ path: "like", select: "title fileUrl author" });
  if (user === null)
    res.json({ result: 0, message: "없어진 계정이거나 없는 계정입니다." });
  else {
    let obj = user.toObject();
    await User.populate(
      obj.like,
      { path: "author", select: "userId userName" },
      (err, docs) => {
        if (!err) res.json({ result: 1, likes: docs });
        else console.log(err);
      }
    );
  }
};

export const postLikeProducts = async (req, res) => {
  const user = await User.findById(req.decoded._id)
    .select("likeProduct likeMaterial")
    .populate({
      path: "likeProduct",
      select: "title pieces locationName state created",
    });
  if (user === null)
    res.json({ result: 0, message: "없어진 계정이거나 없는 계정입니다." });
  else {
    const object = await Piece.populate(user.likeProduct, {
      path: "pieces",
      select: "fileUrl",
    });
    await Material.populate(
      user,
      {
        path: "likeMaterial",
        select: "title fileUrl locationName state created",
      },
      (err, docs) => {
        if (err) console.log(err);
        else {
          console.log(docs);
          let obj = docs.toObject();
          obj.likeProduct.pieces = object;
          let resultObject = {};
          resultObject.likes = obj.likeProduct.concat(obj.likeMaterial);
          resultObject.likes.sort((b, a) => a.created - b.created);
          res.json({ result: 1, likeProducts: resultObject.likes });
        }
      }
    );
  }
};

export const addLikeProduct = async (req, res) => {
  const {
    params: { id },
  } = req;
  const user = await User.findById(req.decoded._id);
  const product = await Product.findOne({ _id: id });
  if (product == null) {
    const material = await Material.findOne({ _id: id });
    if (material == null) {
      res
        .status(404)
        .json({ result: 0, message: "사라지거나 없는 상품입니다." });
    } else {
      try {
        const pos = user.likeMaterial.indexOf(id);

        if (pos != -1) {
          material.like.splice(material.like.indexOf(req.decoded._id), 1);
          material.likeCount--;
          material.save((err) => {
            if (err) {
            }
            user.likeMaterial.splice(pos, 1);
            user.save();
          });
          res.json({ result: 1, message: "좋아요 취소" });
        } else {
          material.like.push(req.decoded._id);
          material.likeCount++;
          material.save((err) => {
            if (err) {
            }
            user.likeMaterial.push(id);
            user.save();
          });
          res.json({ result: 1, message: "좋아요 성공" });
        }
      } catch (err) {
        res.status(500).json({ result: 0, message: "DB 오류" });
      }
    }
  } else {
    try {
      const pos = user.likeProduct.indexOf(id);

      if (pos != -1) {
        product.like.splice(product.like.indexOf(req.decoded._id), 1);
        product.likeCount--;
        product.save((err) => {
          if (err) {
          }
          user.likeProduct.splice(pos, 1);
          user.save();
        });
        res.json({ result: 1, message: "좋아요 취소" });
      } else {
        product.like.push(req.decoded._id);
        product.likeCount++;
        product.save((err) => {
          if (err) {
          }
          user.likeProduct.push(id);
          user.save();
        });
        res.json({ result: 1, message: "좋아요 성공" });
      }
    } catch (err) {
      res.status(500).json({ result: 0, message: "DB 오류" });
    }
  }
};

export const addFollow = async (req, res) => {
  const {
    params: { id },
  } = req;
  const follower = await User.findOne({ _id: id });
  if (follower == null)
    res
      .status(404)
      .json({ result: 0, message: "사라지거나 없는 사용자입니다." });
  else {
    try {
      const user = await User.findById(req.decoded._id);
      const pos = user.follow.indexOf(id);

      if (pos != -1) {
        follower.follower.splice(follower.follow.indexOf(req.decoded._id), 1);
        follower.followerCount--;
        follower.save((err) => {
          if (err) {
            console.log(err);
          }
          user.follow.splice(pos, 1);
          user.save();
        });
        res.json({ result: 1, message: "팔로우 취소" });
      } else {
        follower.follower.push(req.decoded._id);
        follower.followerCount++;
        follower.save((err) => {
          if (err) {
          }
          user.follow.push(id);
          user.save();
        });
        res.json({ result: 1, message: "팔로우 성공" });
      }
    } catch (err) {
      res.status(500).json({ result: 0, message: "DB 오류" });
    }
  }
};

export const postUploadComment = async (req, res) => {
  const {
    params: { id },
  } = req;
  const {
    body: { content },
  } = req;

  const piece = await Piece.findById(id);
  try {
    if (piece == null) {
      const comment = await Comment.findById(id);
      if (comment == null) {
        res.json({ result: 0, message: "입력값 오류" });
      } else {
        const newComment = await Comment({ user: req.decoded._id, content });
        const madeComment = await Comment.create(newComment);
        comment.comments.push(madeComment._id);
        await comment.save((err) => {
          if (err) console.log(err);
          else res.json({ result: 1, message: "대댓글 작성 완료" });
        });
      }
    } else {
      const newComment = await Comment({ user: req.decoded._id, content });
      const madeComment = await Comment.create(newComment);
      piece.comments.push(madeComment._id);
      await piece.save((err) => {
        if (err) console.log(err);
        else res.json({ result: 1, message: "댓글 작성 완료" });
      });
    }
  } catch (err) {
    console.log(err);
    res.json({ result: 0, message: "DB 오류" });
  }
};
