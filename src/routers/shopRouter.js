import express from "express";

import { multerImage } from "../multerMiddleware";
import { jwtMiddleware, checkUser, checkViewUser } from "../jwtMiddleware";
import {
  uploadPiece,
  searchProduct,
  uploadMaterial,
  searchMaterial,
  getProductDetail,
  getMaterialDetail,
  putProductDetail,
  putMaterialDetail,
  getPreProducts,
  getPreProductImages,
  postNewProduct
} from "../controllers/shopController";
const shopRouter = express.Router();

/** Product */
// create
shopRouter.post("/upload/product", jwtMiddleware, postNewProduct); //제 api입니다.
shopRouter.post("/upload/piece", jwtMiddleware, uploadPiece); //기존 api입니다.

// read
shopRouter.get("/my-pieces/pre", jwtMiddleware, getPreProducts); //내 작업실에 있으면서, 아직 업로드 되지 않은 작품들 읽기
shopRouter.get("/my-pieces/pre/images/:id",getPreProductImages);
shopRouter.post("/search/product", searchProduct); //따미샵에 올라온 Piece를 Product라고 한다.
shopRouter.get("/detail/product/:id", getProductDetail);

// update
shopRouter.put("/detail/product/:id", jwtMiddleware, putProductDetail);


/** Material */
//create
shopRouter.post("/upload/material",
  jwtMiddleware,
  // multerImage.array("img", 3),
  uploadMaterial
);

//read
shopRouter.post("/search/material", searchMaterial); //재료샵 검색
shopRouter.get("/detail/material/:id", checkViewUser, getMaterialDetail);

//update
shopRouter.put("/detail/material/:id", jwtMiddleware, putMaterialDetail);


export default shopRouter;
