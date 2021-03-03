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
  putMaterialDetail
} from "../controllers/shopController";
const shopRouter = express.Router();

/** Product */
// create
shopRouter.post("/upload/piece", jwtMiddleware, uploadPiece);

// read
shopRouter.post("/search/product", searchProduct); //따미샵에 올라온 Piece를 Product라고 한다.
shopRouter.get("/detail/product/:id", getProductDetail);

// update
shopRouter.put("/detail/product/:id", jwtMiddleware, putProductDetail);


/** Material */
//create
shopRouter.post("/upload/material",
  jwtMiddleware,
  multerImage.array("img", 3),
  uploadMaterial
);

//read
shopRouter.post("/search/material", searchMaterial); //재료샵 검색
shopRouter.get("/detail/material/:id", checkViewUser, getMaterialDetail);

//update
shopRouter.put("/detail/material/:id", jwtMiddleware, putMaterialDetail);


export default shopRouter;
