import Piece from "../models/Piece";
import Material from "../models/Piece";
import Product from "../models/Piece";
import Student from "../models/Piece";
import Comment from "../models/Piece";

import { AllSearch, Searching } from "./searchController";
import User from "../models/User";
import SearchModel from "../models/Search";
import dotenv from "dotenv";
import { Mongoose } from "mongoose";
import util from "../modules/util";
import responseMessage from "../modules/responseMessage";
import statusCode from "../modules/statusCode";

dotenv.config();

// 테스트 필요
export const getVillage = async (req, res) => {
  const { _id } = req.decoded;
  const { sortingBy, filter, start, offset } = req.body;
  if (!_id) {
    return res
      .status(200)
      .send(util.fail(200, "로그인 먼저 해주세요"));
  }
  if (!zortingBy) {
    console.log('필요한 값이 없습니다.');
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  try {
    const user = await User.findOne({ _id });
    const data = {};
    data.imageUrl = user.imageUrl;
    data.userName - user.userName;
    let sortedBy = ''
    if(sortingBy === "L") {
      //start+1 ~ start+offset 번째 게시물 조회
      sortedBy='최신순'
      const posts = await Piece.find({ hasField: {$in: filter} })
      .select('fileUrl title author likeCnt viewCnt')
      .populate('author', 'userName imageUrl')
      .sort('-createdAt')
      .skip(start).limit(offset);
    } else if (sortingBy === "P") {
      sortedBy='인기순'
      const posts = await Piece.find({ hasField: {$in: filter} })
      .select('fileUrl title author likeCnt viewCnt')
      .populate('author', 'userName imageUrl')
      .sort('likeCnt')
      .skip(start).limit(offset);
    } 
    // else if (sortingBy === "V") {
    //   const posts = await Piece.find({ hasField: {$in: filter} })
    //   .select('fileUrl title author likeCnt viewCnt')
    //   .populate('author', 'userName imageUrl')
    //   .sort('viewCnt')
    //   .skip(start).limit(offset);
    // } 
    else {
      return res
        .status(400)
        .send(util.fail(400), '파라미터값이 잘못되었습니다');
    }
    data.posts = posts;
    data.nextStartId = start + offset;
    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, `따미마을 게시물 ${sortedBy}으로 조회 성공`, data))
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send(util.fail(500, responseMessage.INTERNAL_SERVER_ERROR));
  }
}

export const getAuthorSearch = async (req, res) => {
  let {
    query: { list, count, searchingBy },
  } = req;
  !list ? (list = 0) : (list = +list);
  !count ? (count = 30) : (count = +count);
  if (!searchingBy || searchingBy === "") {
    try {
      const authors = await User.find()
        .sort({ followerCount: -1 })
        .skip(list * count)
        .limit(count)
        .select("userId likeField follower imageUrl stateMessage");

      let obj = JSON.parse(JSON.stringify(authors));

      obj.forEach((e) => {
        e.followByMe = checkInclude(e.follower, req);
      });

      res.json({ result: 0, authors: obj });
    } catch (e) {
      console.log(e);
    }
  } else {
    const authors = await User.find({
      userId: { $regex: searchingBy, $options: "i" },
    })
      .sort({ followerCount: -1 })
      .skip(list * count)
      .limit(count)
      .select("userId likeField follower imageUrl stateMessage");
    let obj = JSON.parse(JSON.stringify(authors));
    obj.forEach((e) => {
      e.followByMe = checkInclude(e.follower, req);
    });

    res.json({ result: 0, authors: obj });
  }
};

export const postAuthorSearch = async (req, res) => {
  let {
    body: { list, count, searchingBy },
  } = req;
  !list ? (list = 0) : (list = +list);
  !count ? (count = 30) : (count = +count);
  if (!searchingBy || searchingBy === "") {
    try {
      const authors = await User.find()
        .sort({ followerCount: -1 })
        .skip(list * count)
        .limit(count)
        .select("userId likeField follower imageUrl stateMessage");
      let obj = JSON.parse(JSON.stringify(authors));
      obj.forEach((e) => {
        e.followByMe = checkInclude(e.follower, req);
      });

      res.json({ result: 0, authors: obj });
    } catch (e) {
      console.log(e);
    }
  } else {
    const authors = await User.find({
      userId: { $regex: searchingBy, $options: "i" },
    })
      .sort({ followerCount: -1 })
      .skip(list * count)
      .limit(count)
      .select("userId likeField follower imageUrl stateMessage");
    let obj = JSON.parse(JSON.stringify(authors));
    obj.forEach((e) => {
      e.followByMe = checkInclude(e.follower, req);
    });

    res.json({ result: 0, authors: obj });
  }
};

export const postSearch = async (req, res) => {
  let {
    body: { field, sortingBy, list, count, searchingBy },
  } = req;

  !list ? (list = 0) : (list = +list);
  !count ? (count = 30) : (count = +count);

  if (!searchingBy || searchingBy === "") {
    if (!sortingBy || sortingBy === "D") {
      if (!field || field.length == 0) {
        // 전체 분야
        try {
          let obj = await AllSearch.allSearch(list, count);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await AllSearch.fieldSearch(field, list, count);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else if (sortingBy === "L") {
      if (!field) {
        // 전체 분야
        try {
          let obj = await AllSearch.allSearchByLike(list, count);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await AllSearch.allFieldSearchByLike(field, list, count);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else if (sortingBy === "V") {
      if (!field) {
        // 전체 분야
        try {
          let obj = await AllSearch.allSearchByView(list, count);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await AllSearch.allSearchByView(field, list, count);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else {
      res.json({ result: 0, message: "잘못된 형식입니다." });
    }
  } else {
    addSearch(req, res, searchingBy);
    if (!sortingBy || sortingBy === "D") {
      if (!field || field.length == 0) {
        // 전체 분야
        try {
          let obj = await Searching.search(list, count, searchingBy);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await Searching.fieldSearch(list, count, searchingBy);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else if (sortingBy === "L") {
      if (!field) {
        // 전체 분야
        try {
          let obj = await Searching.searchByLike(list, count, searchingBy);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await Searching.fieldSearchByLike(
            field,
            list,
            count,
            searchingBy
          );
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else if (sortingBy === "V") {
      if (!field) {
        // 전체 분야
        try {
          let obj = await Searching.searchByView(list, count, searchingBy);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await Searching.fieldSearchByView(
            field,
            list,
            count,
            searchingBy
          );
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else {
      res.json({ result: 0, message: "잘못된 형식입니다." });
    }
  }
};

export const getSearch = async (req, res) => {
  let {
    query: { field, sortingBy, list, count, searchingBy },
  } = req;

  !list ? (list = 0) : (list = +list);
  !count ? (count = 30) : (count = +count);

  if (!searchingBy || searchingBy === "") {
    if (!sortingBy || sortingBy === "D") {
      if (!field || field.length == 0) {
        // 전체 분야
        try {
          let obj = await AllSearch.allSearch(list, count);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await AllSearch.fieldSearch(field, list, count);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else if (sortingBy === "L") {
      if (!field) {
        // 전체 분야
        try {
          let obj = await AllSearch.allSearchByLike(list, count);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await AllSearch.allFieldSearchByLike(field, list, count);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else if (sortingBy === "V") {
      if (!field) {
        // 전체 분야
        try {
          let obj = await AllSearch.allSearchByView(list, count);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await AllSearch.allSearchByView(field, list, count);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else {
      res.json({ result: 0, message: "잘못된 형식입니다." });
    }
  } else {
    addSearch(req, res, searchingBy);
    if (!sortingBy || sortingBy === "D") {
      if (!field || field.length == 0) {
        // 전체 분야
        try {
          let obj = await Searching.search(list, count, searchingBy);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await Searching.fieldSearch(list, count, searchingBy);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else if (sortingBy === "L") {
      if (!field) {
        // 전체 분야
        try {
          let obj = await Searching.searchByLike(list, count, searchingBy);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await Searching.fieldSearchByLike(
            field,
            list,
            count,
            searchingBy
          );
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else if (sortingBy === "V") {
      if (!field) {
        // 전체 분야
        try {
          let obj = await Searching.searchByView(list, count, searchingBy);
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await Searching.fieldSearchByView(
            field,
            list,
            count,
            searchingBy
          );
          obj = docToJSON(req, obj);
          res.status(200).json({ result: 1, pieces: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else {
      res.json({ result: 0, message: "잘못된 형식입니다." });
    }
  }
};

export const addSearch = async (req, res, searchingBy) => {
  if (req.decoded) {
    try {
      const user = await SearchModel.findOne({ user: req.decoded._id });
      if (user !== null) {
        console.log("있는 검색어 저장");
        if (user.searches.length < 10) {
          user.searches.push(searchingBy);
          user.save();
        } else {
          user.searches.shift();
          user.searches.push(searchingBy);
          user.save();
        }
      } else {
        console.log("새로 검색어 저장");
        const search = await SearchModel({
          user: req.decoded._id,
          searches: searchingBy,
        });
        await SearchModel.create(search);
      }
    } catch (e) {
      console.log(e);
      res.json({ result: 0, message: "DB 오류" });
    }
  }
};
export const postSearchHistory = async (req, res, searchingBy) => {
  try {
    const history = await SearchModel.findOne({ user: req.decoded._id }).select(
      "searches"
    );
    res.json({ result: 1, history: history.searches });
  } catch (e) {
    console.log(e);
    res.json({ result: 0, message: "DB 오류" });
  }
};
export const checkInclude = (data, req) => {
  if (!req.decoded) {
    return false;
  } else {
    return data.some((e) => e === req.decoded._id);
  }
};

export const docToJSON = (req, documents) => {
  let obj = JSON.parse(JSON.stringify(documents));
  obj.forEach((e) => {
    e.likeByMe = checkInclude(e.like, req);
  });
  return obj;
};

export const dbCollectionDrop = async (req, res) => {
  try {
    await SearchModel.collection.drop();
    await Material.collection.drop();
    await User.collection.drop();
    await Product.collection.drop();
    await Comment.collection.drop();
    await Student.collection.drop();
    await Piece.collection.drop();
    res.json({ message: "DB 초기화" });
  } catch (err) {
    console.log(err);
    res.json({ message: "DB ERROR" });
  }
};
