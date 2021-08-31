import express from 'express';
import passport from 'passport';
import { Strategy } from 'passport-kakao'
import User from '../models/User'
const router = express.Router();


passport.use('kakao', new Strategy({
  clientID: "9f2bc688eaf9b3491bf79d12aa7dcd98",
  callbackURL: '/auth/kakao/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const exUser = await User.findOne({
      where: {
        socialType: 'kakao',
        socialId: profile.id
      }
    })
    if (exUser) {
      done(null, exUser);
      return;
    }
    done(new Error("가입되지 않은 아이디", null))
} catch (err) {
    done(new Error("카카오 로그인 실패", null))
  }
}))

router.get('/', (req, res) => {
  if (req.login) {
    console.log(req.login);
    res.status(200).json({
      data: req.login,
      statusCode: 200,
      message: "카카오 소셜로그인 성공"
    })
  } else {
    res.status(500).json({
      statusCode: 500,
      message: "카카오 소셜로그인 실패"
    })
  }
})

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/',
}), (req, res) => {
  res.redirect('/auth');
});

export default router;