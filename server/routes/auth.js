const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit'); // Add rate limiting

const { isLoggedIn, isNotLoggedIn } = require('../middlewares');
const { join, login, logout } = require('../controllers/auth');

const User = require('../models/user'); // 모델 경로에 맞게 수정

const router = express.Router();

// Rate limiter for login and delete operations
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many login attempts from this IP, please try again after 15 minutes"
});

const deleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many delete requests from this IP, please try again after 15 minutes"
});

// POST /auth/join - 회원가입 처리
// router.post('/join', isNotLoggedIn, join);
router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join');  // 회원가입 페이지 렌더링
});

// POST /auth/join - 회원가입 처리
router.post('/join', isNotLoggedIn, join);


// POST /auth/login - 로그인 처리

router.get('/login', isNotLoggedIn, (req, res) => {
  res.render('login');  // 회원가입 페이지 렌더링
});


router.post('/login', isNotLoggedIn, loginLimiter, passport.authenticate('local', {
  failureRedirect: '/auth/login',  // 로그인 실패 시 다시 로그인 페이지로 리다이렉트
  failureFlash: true,
}), (req, res) => {
  // 로그인 성공 시 / 페이지로 리다이렉트
  res.redirect('/layout');
});

// GET /auth/logout - 로그아웃 처리
router.get('/logout', isLoggedIn, logout);


// 회원 탈퇴

// router.post("/delete", isLoggedIn, async (req, res, next) => {
//   try {
//     await User.destroy({
//       where: { id: req.user.id }
//     });

//     req.logout((err) => {
//       if (err) return next(err);
//       req.session.destroy(() => {
//         res.json({ message: "회원 탈퇴가 완료되었습니다." });
//         res.redirect('/');
//       });
//     });
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// });

// router.post("/delete", isLoggedIn, async (req, res, next) => {
//   try {
//     await User.destroy({
//       where: { id: req.user.id }
//     });

//     req.logout((err) => {
//       if (err) return next(err);
//       req.session.destroy(() => {
//         res.redirect('/');  // 회원 탈퇴 후 홈으로 리다이렉트
//       });
//     });
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// });

router.post("/delete", isLoggedIn, deleteLimiter, async (req, res, next) => {
  try {
    await User.destroy({
      where: { id: req.user.id }
    });
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.json({ message: "회원 탈퇴가 완료되었습니다." });
      });
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});



module.exports = router;
