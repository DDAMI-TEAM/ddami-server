const statusCode = require('../modules/statusCode');
const util = require('../modules/util');
const User = require('../schemas/user');
module.exports = {
  checkStudent: async (req, res, next) => {
    try{
      const user = await User.findById(req.decoded._id);
      if (!user) {
        return res.status(404).send(util.fail(404, '없는 회원입니다.'));
      }
      if (!user.isStudent) {
        console.log('일반인입니다');
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, '미대생 인증을 해주세요'));
      }
      next();
    } catch (err) {
      console.log(err);
      return res.status(500).send(util.fail(500, 'checkStudent 오류'));
    }
  },
  checkUser: async (req, res, next) => {
    try {
      const user = await User.findById(req.decoded._id);
      if (!user) {
        return res.status(404).send(util.fail(404, '없는 회원입니다.'));
      }
      next();
    } catch (err) {
      console.log(err);
      return res.status(500).send(util.fail(500, 'checkUser 오류'));
    }
  }
}