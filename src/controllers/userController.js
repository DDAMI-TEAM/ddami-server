import User from "../models/User";
import Piece from "../models/Piece";
import Comment from "../models/Comment";
import Product from "../models/Product";
import Material from "../models/Material";
import Student from "../models/Student";
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';
import responseMessage from "../modules/responseMessage";
import statusCode from "../modules/statusCode";
import util from "../modules/util";
import crypto from "crypto";
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
  if(!req.decoded) {
    console.log('토큰 값이 없습니다.');
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, '토큰 값이 없습니다.'));
  }
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
      userPhone,
    },
  } = req;
  if (!userId || !userPassword || !userName || !userPhone) {
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
        userPhone,
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
            async (err, token) => {
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
                data.userName = user.userName;
                data.profileUrl = user.imageUrl;
                data.isStudent = user.state;
                if(data.isStudent) {
                  const student = await Student.findOne({ user: user._id }, 'department');
                  data.department = student.department;
                }
                return res
                  .status(statusCode.OK)
                  .send(util.success(statusCode.OK, `${userId}로 로그인 성공`, data));
              }
            }
          );
        } else { // 비밀번호가 틀린 경우
          return res
            .status(statusCode.OK)
            .send(util.fail(statusCode.OK, responseMessage.MISS_MATCH_PW));
        }
      } else { // user가 Null 일 경우
        return res
        .status(403) //권한오류
        .send(util.success(403, "존재하지 않는 ID입니다."));
      }
    } catch (err) {
      console.log(err)
      return res
        .status(statusCode.INTERNAL_SERVER_ERROR)
        .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    }
  } else {
    const { _id } = req.decoded;
    try {
      const user = await User.findOne({ _id });
      const data = {};
      data.userName = user.userName;
      data.profileUrl = user.imageUrl;
      data.isStudent = user.state;
      if(data.isStudent) {
        const student = await Student.findOne({ user: _id }, 'department');
        data.department = student.department;
      }
      return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, `${req.decoded.userId}로 자동로그인 성공`, data));
    } catch(err) {
      console.log(err);
      return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    }
  }
};

export const postUpload = async (req, res) => {
  const {
    body: { title, description, hasField },
  } = req;
  if(!req.decoded) {
    console.log('토큰 값이 없습니다.');
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, '토큰 값이 없습니다.'));
  }
  try {
    const user = await User.findOne({ userId: req.decoded.userId });
    if (!user.state) {
      console.log('일반인 작품 업로드 시도');
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, '미대생 인증을 해주세요'));
    }
    const fileUrl = req.files.map(file => file.location);
    const piece = await Piece({
      fileUrl,
      title,
      description,
      hasField,
      author: user._id,
    });
    await piece.save();
    user.myPieces.push(piece._id);
    await user.save();
    const piecdId = piece._id;
    return res
      .status(201)
      .send(util.success(201, '업로드 성공', { piecdId }));
    // piece.save((err) => {
    //   if (err) {
    //     throw err;
    //   } else {
    //     user.myPieces.push(piece._id);
    //     user.save((err) => {
    //       if (err) throw err;
    //       return res
    //         .status(201)
    //         .send(util.success(201, '업로드 성공'));
    //     }
    //   }
    // });
  } catch (e) {
    console.log(e);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};

/** [GET] /user/myInfo */
export const getMyInfo = async (req, res) => {
  if (!req.decoded) {
    console.log('req.decoded가 없습니다');
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  const _id = req.decoded._id;
  try {
    const user = await User.findOne({ _id }).select('userName imageUrl state');
    const data = {};
    data.userName = user.userName;
    data.imageUrl = user.imageUrl;
    data.isStudent = user.state;
    if (!user.state) {
      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, '내 프로필(일반인) 불러오기 성공', data));
    }
    const student = await Student.findOne({ user: _id });
    data.department = student.department;
    data.likeField = student.likeField;
    data.stateMessage = student.stateMessage;
    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, '내 프로필(미대생) 불러오기 성공', data));
  } catch(err) {
    console.log(err)
    return res
      .status(statusCode(INTERNAL_SERVER_ERROR))
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, repsonseMessage.INTERNAL_SERVER_ERROR));
  }
}

/** [PUT] /user/myInfo */
export const putMyInfo = async (req, res) => {
  if (!req.decoded) {
    console.log('req.decoded가 없습니다');
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  const id = req.decoded._id;
  try {
    const user = await User.findOne({ _id: id });
    if (req.file) {
      const imageUrl = req.file.location;
      user.imageUrl = imageUrl;
      await user.save();
    }
    if (!user.state) {
      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, '일반회원 정보 수정 성공'));
    }
    const student = await Student.findOne({ user: id })
    if (!student) {
      throw new Error('해당 id의 student 객체가 없음');
    }
    const { stateMessage, likeField } = req.body;
    student.stateMessage = stateMessage;
    student.likeField = likeField; // null 이어도 됨 (관심 분야가 없는 경우)
    await student.save();
    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, '미대생 정보 수정 성공'));
  }catch(err){
    console.log(err);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
}

// 머야...
export const getUserDetail = async (req, res) => {
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
  const { pieceId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(pieceId)) {
    console.log('올바르지 않은 작품 id입니다.');
    return res
      .status(400)
      .send(util.fail(400, '올바르지 않은 작품 아이디입니다.'));
  }
  const piece = await Piece.findOne({ _id: pieceId });
  if (piece == null)
    return res
      .status(404)
      .send(util.fail(404, "존재하지 않는 작품 아이디입니다."));
  else {
    if(!req.decoded) {
      console.log('토큰 값이 없습니다.');
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, '토큰 값이 없습니다.'));
    }
    try {
      const user = await User.findById(req.decoded._id);
      const pos = user.like.indexOf(pieceId);

      if (pos != -1) {
        piece.like.splice(piece.like.indexOf(req.decoded._id), 1);
        piece.likeCount--;
        piece.save((err) => {
          if (err) {
          }
          user.like.splice(pos, 1);
          user.save();
        });
        return res.status(statusCode.OK).send(util.success(statusCode.OK, '좋아요 취소 성공'));
      } else {
        piece.like.push(req.decoded._id);
        piece.likeCount++;
        piece.save((err) => {
          if (err) {
          }
          user.like.push(pieceId);
          user.save();
        });
        return res.status(statusCode.OK).send(util.success(statusCode.OK, '좋아요 등록 성공'));
      }
    } catch (err) {
      console.log(err);
      return res
        .status(statusCode.INTERNAL_SERVER_ERROR)
        .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    }
  }
};

export const postMyPieces = async (req, res) => {
  if(!req.decoded) {
    console.log('토큰 값이 없습니다.');
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, '토큰 값이 없습니다.'));
  }
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
  //학생증 업로드 후 경로 가져오기
  const imageUrl = req.file.location || "";
  if (!university || !department || !number || !imageUrl || !req.decoded) {
    console.log('필요한 값이 없습니다.');
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  const user = await User.findById(req.decoded._id);
  if (user === null) {
  } else if (user.state === true) { //이미 인증된 사용자
    return res
      .status(statusCode.OK)
      .send(util.fail(statusCode.OK, "이미 인증된 사용자입니다."));
  } else { // 인증 시작
    try {
      if (!likeField) likeField = [];
      const student = await Student({
        user: req.decoded._id,
        university,
        department,
        number,
        authImage: imageUrl
      });
      await Student.create(student);

      user.state = true;
      user.likeField = likeField;
      
      await user.save((err) => {
        if (!err) {
          return res
            .status(statusCode.OK)
            .send(util.success(statusCode.OK, '미대생 인증 되었습니다.'));
        } else {
          console.log(err);
          return res
            .status(statusCode.INTERNAL_SERVER_ERROR)
            .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
        }
      });
    } catch (err) {
      console.log(err);
      return res
        .status(statusCode.INTERNAL_SERVER_ERROR)
        .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    }
  }
};

/** 내작업실 [GET] /user/atelier/:id */
export const getAtelier = async (req, res) => {
  try {
    const { userId } = req.params;
    if(!req.decoded) {
      console.log('토큰 값이 없습니다.');
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, '토큰 값이 없습니다.'));
    }
    const user = await User.findOne({ userId: userId })
                            .select("userId userName imageUrl myPieces likeField follow followerCount")
                            .populate({ path: "myPieces", select: "fileUrl" });
    if (!user) {
      return res.status(401).send(util.fail(401, '토큰의 사용자가 유효하지 않습니다.'));
    } else {
      let obj = user.toObject();
      obj.follow = obj.follow.length;
      delete obj._id;
      obj.myPieces.forEach(p => {
        p.fileUrl = p.fileUrl[0];
      })
      const student = await Student.findOne({ user: user._id }).select(
        "university department"
      );
      // if (student === null) res.json({ result: 1, mypieces: user.myPieces });
      if (!student){
        return res
          .status(statusCode.FORBIDDEN)
          .send(util.fail(statusCode.FORBIDDEN, responseMessage.READ_STUDENT_FAIL));
      } else {
        obj.student = student.toObject();
        delete obj.student._id;
        for(let key in obj.student){
          obj[key] = obj.student[key];
        }
        delete obj.student;
        obj.isSelf = (req.decoded.userId === userId) ? true : false;
        return res
          .status(statusCode.OK)
          .send(util.success(statusCode.OK, `${userId}의 작업실 조회 성공`, obj));
      }
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send(util.success(500, '서버 내부 오류'));
  }
};

export const getLikePieces = async (req, res) => {
  if(!req.decoded) {
    console.log('토큰 값이 없습니다.');
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, '토큰 값이 없습니다.'));
  }
  const user = await User.findById(req.decoded._id)
    .select("like")
    .populate({ path: "like", select: "title fileUrl author" });
  if (user === null)
    return res.status(statusCode.NOT_FOUND).send(util.fail(statusCode.NOT_FOUND, "없어진 계정이거나 없는 계정입니다."));
  else {
    let obj = user.toObject();
    await User.populate(
      obj.like,
      { path: "author", select: "userId userName" },
      (err, docs) => {
        if (!err) res.status(200).json({ status: 200, result: 1, likes: docs });
        else { console.log(err); return res.status(500).send(util.fail(500, responseMessage.INTERNAL_SERVER_ERROR)); }
      }
    );
  }
};

export const getLikeProducts = async (req, res) => {
  if(!req.decoded) {
    console.log('토큰 값이 없습니다.');
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, '토큰 값이 없습니다.'));
  }
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
  if(!req.decoded) {
    console.log('토큰 값이 없습니다.');
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, '토큰 값이 없습니다.'));
  }
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

/** [GET] /user/follow/:id */
export const getFollow = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findOne({ userId }).select('follow').populate('follow', 'userName userId state imageUrl');
    if (!user) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, '해당 아이디의 사용자가 없습니다.'));
    }
    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, '팔로잉 목록 조회 성공', user));
  } catch (err) {
    console.log(err);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
}

export const getFollower = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findOne({ userId }).select('follower').populate('follower', 'userName userId state imageUrl');
    if(!user || !user.state) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, '해당 아이디의 미대생이 없습니다.'));
    }
    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, '팔로워 목록 조회 성공', user));
  } catch (err) {
    console.log(err);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
}

/** [PUT] /user/my-following/:userId */
export const putFollow = async (req, res) => {
  const {
    params: { userId },
  } = req;
  console.log(userId);
  const follower = await User.findOne({ userId });
  if (follower == null)
    res
      .status(404)
      .json({ status: 404, result: 0, message: "사라지거나 없는 사용자입니다." });
  else {
    try {
      if(!req.decoded) {
        console.log('토큰 값이 없습니다.');
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, '토큰 값이 없습니다.'));
      }
      const user = await User.findById(req.decoded._id);
      const pos = user.follow.indexOf(follower._id);

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
          user.follow.push(follower._id);
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
  if(!req.decoded) {
    console.log('토큰 값이 없습니다.');
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, '토큰 값이 없습니다.'));
  }
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
