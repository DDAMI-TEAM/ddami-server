import Product from "../models/Product";
import Material from "../models/Material";
import User from "../models/User";
import Piece from "../models/Piece";
// import { converter } from "../university";
import { AllSearch, Searching } from "./productSearchController";
import { AllSearch2, Searching2 } from "./materialSearchController";
import { addSearch } from "./apiController";
import statusCode from "../modules/statusCode";
import util from "../modules/util";
import responseMessage from "../modules/responseMessage";


export const putProductDetail = async (req, res) => {
  return res;
};

export const putMaterialDetail = async (req, res) => {
  return res;
};

/** [GET] /shop/my-pieces/pre */
export const getPreProducts = async (req, res) => {
  if (!req.decoded) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, '토큰 값이 없습니다'));
  }
  try {
    const user = await User.find({id: req.decoded._id });
    if (!user.state) {
      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, '일반 회원은 작품 등록이 불가능합니다.'));
    }
    const pieces = await Piece.find({ userId: req.decoded._id }).select("id fileUrl");
    // dev: 여기에 select 조건을 추가해야하나..? (상태에 따라서 선택할 수 있는지 없는 지 모르겠음)
    pieces.forEach(e => {
      e.fileUrl = e.fileUrl[0];
    });
    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, '작품 피드 조회 성공', pieces));
  } catch(err) {
    console.log(err);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
}

/** [GET] /shop/my-pieces/pre/images/:id */
export const getPreProductImages = async (req, res) => {
  const { pieceId } = req.param;
  try {
    const pResult = await Piece.find({id: pieceId}).select("fileUrl");
    const data = {};
    data.piecdId = pieceId;
    data.fileUrls = pResult.fileUrl;
    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, '선택 피드의 모든 사진 조회 성공', data))
  } catch(err) {
    console.log(err);
    return res
      .status(500)
      .send(util.fail(500, responseMessage.INTERNAL_SERVER_ERROR));
  }
}

/** [POST] /shop/upload/product */
export const postNewProduct = async (req, res) => {
  // 내가 이해한 바로는 작품 자체에는 상태가 없어도 된다. 그냥 이미지만 가져오면 됨
  const { fileUrls, title, price, description, hasField, locationName } = req.body;
  if(!title || !price || !locationName) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  try {
    const newProduct = await Product({ 
      author: req.decoded._id,
      fileUrls, 
      title, 
      price, 
      description, 
      hasField, 
      locationName,
      //location: converter(locationName)
    });
    const uploadedProduct = await Product.create(newProduct);
    const data = {};
    data.uploadedProductId = uploadedProduct.id;
    return res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, '따미샵 상품 업로드 성공', data));
  } catch(err) {
    console.log(err);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
}
export const uploadPiece = async (req, res) => {
  const {
    body: { pieces, title, price, description, hasField, locationName },
  } = req; // pieces는 id 배열
  const user = await User.findById(req.decoded._id);
  console.log(user);
  if (user === null)
    res.json({ result: 0, message: "사라지거나 없어진 계정입니다." });
  else if (user.state === false)
    res.json({ result: 0, message: "미대생 인증을 먼저 해주세요" });
  else if (!pieces)
    res.json({ result: 0, message: "작품을 하나 이상 선택해주세요" });
  else if (!checkMyPiece(pieces, user))
    res.json({ result: 0, message: "잘못된 접근이거나 없는 작품입니다." });
  else {
    try {
      const product = await Product({
        pieces,
        title,
        price,
        description,
        author: req.decoded._id,
        hasField,
        locationName,
        //location: converter(locationName),
      });
      await Product.create(product);
      // 작품의 상태를 판매중으로 바꾸는 과정이 왜 필요하지...
      for (const e of pieces) {
        await Piece.findByIdAndUpdate(e, { state: 1 }, (err) => {
          if (err) {
            console.log(err);
            return;
          }
        });
      }
      res.json({
        result: 1,
        message: "성공적으로 따미 작품샾에 업로드 하였습니다.",
      });
    } catch (err) {
      console.log(err);
      res.json({ result: 0, message: "DB 오류" });
    }
  }
};

export const uploadMaterial = async (req, res) => {
  console.log(req);
  //내껀지 검증먼저 pieces
  const {
    body: { title, price, description, hasField, locationName },
  } = req;
  const user = await User.findById(req.decoded._id);
  if (user === null)
    res.json({ result: 0, message: "사라지거나 없어진 계정입니다." });
  else {
    try {
      const fileUrl = [];

      if (req.files) {
        if (req.files.length == 0)
          console.log();
          //fileUrl.push(`${process.env.BASE_URL}/uploads/material.jpg`);

        else {
          for (var e of req.files)
            console.log();
            //fileUrl.push(`${process.env.BASE_URL}/uploads/${e.filename}`);
        }
      }
      const material = await Material({
        fileUrl,
        title,
        price,
        description,
        author: req.decoded._id,
        hasField,
        locationName,
        // location: converter(locationName),
      });
      await Material.create(material);

      res.json({
        result: 1,
        message: "성공적으로 따미 재료샾에 업로드 하였습니다.",
      });
    } catch (err) {
      console.log(err);
      res.json({ result: 0, message: "DB 오류" });
    }
  }
};

export const searchProduct = async (req, res) => {
  let {
    body: { field, sortingBy, list, count, searchingBy, location },
  } = req;

  !list ? (list = 0) : (list = +list);
  !count ? (count = 30) : (count = +count);

  if (!searchingBy || searchingBy === "") {
    if (!sortingBy || sortingBy === "D") {
      if (!field || field.length == 0) {
        // 전체 분야
        try {
          let obj = await AllSearch.allSearch(list, count);
          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await AllSearch.fieldSearch(field, list, count);
          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
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
          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await AllSearch.allFieldSearchByLike(field, list, count);
          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else if (sortingBy === "T") {
      if (!location) {
        res.json({ result: 0, message: "위치정보를 입력해주세요." });
        return;
      }
      if (!field) {
        // 전체 분야
        try {
          let obj = await AllSearch.allSearchByDistance(list, count, location);
          await Product.populate(
            obj,
            { path: "pieces", select: "fileUrl" },
            function (err, products) {
              if (err) res.json(err);
              else {
                obj = documentToJSON(req, products);
                res.status(200).json({ result: 1, products: obj });
              }
            }
          );
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await AllSearch.allSearchByDistance(
            field,
            list,
            count,
            location
          );
          await Product.populate(
            obj,
            { path: "pieces", select: "fileUrl" },
            function (err, products) {
              if (err) res.json(err);
              else {
                obj = documentToJSON(req, products);
                res.status(200).json({ result: 1, products: obj });
              }
            }
          );
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
          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await Searching.fieldSearch(list, count, searchingBy);
          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
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

          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
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
          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else if (sortingBy === "T") {
      if (!location) {
        res.json({ result: 0, message: "위치정보를 입력해주세요." });
        return;
      }
      if (!field) {
        // 전체 분야
        try {
          let obj = await Searching.searchByDistance(
            list,
            count,
            searchingBy,
            location
          );
          await Product.populate(
            obj,
            { path: "pieces", select: "fileUrl" },
            function (err, products) {
              if (err) res.json(err);
              else {
                obj = documentToJSON(req, products);
                res.status(200).json({ result: 1, products: obj });
              }
            }
          );
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await Searching.fieldSearchByDistance(
            field,
            list,
            count,
            searchingBy,
            location
          );
          await Product.populate(
            obj,
            { path: "pieces", select: "fileUrl" },
            function (err, products) {
              if (err) res.json(err);
              else {
                obj = documentToJSON(req, products);
                res.status(200).json({ result: 1, products: obj });
              }
            }
          );
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

export const searchMaterial = async (req, res) => {
  let {
    body: { field, sortingBy, list, count, searchingBy, location },
  } = req;

  !list ? (list = 0) : (list = +list);
  !count ? (count = 30) : (count = +count);

  if (!searchingBy || searchingBy === "") {
    if (!sortingBy || sortingBy === "D") {
      if (!field || field.length == 0) {
        // 전체 분야
        try {
          let obj = await AllSearch2.allSearch(list, count);
          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await AllSearch2.fieldSearch(field, list, count);
          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else if (sortingBy === "L") {
      if (!field) {
        // 전체 분야
        try {
          let obj = await AllSearch2.allSearchByLike(list, count);
          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await AllSearch2.allFieldSearchByLike(field, list, count);
          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else if (sortingBy === "T") {
      if (!location) {
        res.json({ result: 0, message: "위치정보를 입력해주세요." });
        return;
      }
      if (!field) {
        // 전체 분야
        try {
          let obj = await AllSearch2.allSearchByDistance(list, count, location);
          await Product.populate(
            obj,
            { path: "pieces", select: "fileUrl" },
            function (err, products) {
              if (err) res.json(err);
              else {
                obj = documentToJSON(req, products);
                res.status(200).json({ result: 1, products: obj });
              }
            }
          );
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await AllSearch2.allSearchByDistance(
            field,
            list,
            count,
            location
          );
          await Product.populate(
            obj,
            { path: "pieces", select: "fileUrl" },
            function (err, products) {
              if (err) res.json(err);
              else {
                obj = documentToJSON(req, products);
                res.status(200).json({ result: 1, products: obj });
              }
            }
          );
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
          let obj = await Searching2.search(list, count, searchingBy);
          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await Searching2.fieldSearch(list, count, searchingBy);
          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else if (sortingBy === "L") {
      if (!field) {
        // 전체 분야
        try {
          let obj = await Searching2.searchByLike(list, count, searchingBy);

          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await Searching2.fieldSearchByLike(
            field,
            list,
            count,
            searchingBy
          );
          obj = documentToJSON(req, obj);
          res.status(200).json({ result: 1, products: obj });
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      }
    } else if (sortingBy === "T") {
      if (!location) {
        res.json({ result: 0, message: "위치정보를 입력해주세요." });
        return;
      }
      if (!field) {
        // 전체 분야
        try {
          let obj = await Searching2.searchByDistance(
            list,
            count,
            searchingBy,
            location
          );
          await Product.populate(
            obj,
            { path: "pieces", select: "fileUrl" },
            function (err, products) {
              if (err) res.json(err);
              else {
                obj = documentToJSON(req, products);
                res.status(200).json({ result: 1, products: obj });
              }
            }
          );
        } catch (e) {
          console.log(e);
          res.status(500).json({ result: 0, message: "DB 오류" });
        }
      } else {
        // 부분 분야
        try {
          let obj = await Searching2.fieldSearchByDistance(
            field,
            list,
            count,
            searchingBy,
            location
          );
          await Product.populate(
            obj,
            { path: "pieces", select: "fileUrl" },
            function (err, products) {
              if (err) res.json(err);
              else {
                obj = documentToJSON(req, products);
                res.status(200).json({ result: 1, products: obj });
              }
            }
          );
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

export const getProductDetail = async (req, res) => {
  const {
    params: { id },
  } = req;
  const product = await Product.findOne({ _id: id })
    .select("title hasField price like locationName description")
    .populate({
      path: "author",
      select: "imageUrl userId userName",
    });
  if (product == null)
    res.json({ result: 0, message: "없거나 사라진 상품입니다." });
  else {
    const obj = product.toObject();
    obj.likeByUser = checkLike(product.like, req);
    res.json({ result: 1, product: obj });
  }
};

export const getMaterialDetail = async (req, res) => {
  const {
    params: { id },
  } = req;
  const material = await Material.findOne({ _id: id })
    .select("title hasField price like locationName description")
    .populate({
      path: "author",
      select: "imageUrl userId userName",
    });

  if (material == null)
    res.json({ result: 0, message: "없거나 사라진 재료입니다." });
  else {
    const obj = material.toObject();
    obj.likeByUser = checkLike(material.like, req);
    res.json({ result: 1, material: obj });
  }
};

const checkLike = (data, req) => {
  if (!req.decoded) {
    return false;
  } else {
    return data.some((e) => e === req.decoded._id);
  }
};

const documentToJSON = (req, documents) => {
  let obj = JSON.parse(JSON.stringify(documents));
  obj.forEach((e) => {
    e.likeByMe = checkLike(e.like, req);
  });
  return obj;
};

const checkMyPiece = (pieces, user) => {
  console.log(user);
  for (const e of pieces) {
    console.log(e);
    if (user.myPieces.indexOf(e) === -1) return false;
  }
  return true;
};
