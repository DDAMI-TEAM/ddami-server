const mongoose = require('mongoose');

module.exports = {
  checkPieceIdValid: (req, res, next) => {
    const { piece_id } = req.params;
    if(!piece_id) {
      console.log('null parameter');
      return res.status(400).send(util.fail(400, '파리미터가 없습니다.'));
    }
    if (mongoose.Types.ObjectId.isValid(piece_id))
      next();
    else {
      return res.status(400).send(util.fail(400, '올바르지 않은 작품 id입니다'));
    }
  },
  checkProductIdValid: (req, res, next) => {
    const { product_id } = req.params;
    if(!product_id) {
      console.log('null parameter');
      return res.status(400).send(util.fail(400, '파리미터가 없습니다.'));
    }
    if (mongoose.Types.ObjectId.isValid(product_id))
      next();
    else {
      return res.status(400).send(util.fail(400, '올바르지 않은 따미샵 작품 id입니다'));
    }
  },
  checkMaterialIdValid: (req, res, next) => {
    const { material_id } = req.params;
    if(!material_id) {
      console.log('null parameter');
      return res.status(400).send(util.fail(400, '파리미터가 없습니다.'));
    }
    if (mongoose.Types.ObjectId.isValid(material_id))
      next();
    else {
      return res.status(400).send(util.fail(400, '올바르지 않은 따미샵 재료 id입니다'));
    }
  }
}