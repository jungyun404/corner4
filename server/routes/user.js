const express = require('express');
const rateLimit = require('express-rate-limit'); // Import the rate limiting middleware

const { isLoggedIn } = require('../middlewares');
const { follow } = require('../controllers/user');
const { User } = require('../models');

const router = express.Router();

// Define rate limiting rules
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

router.post('/:id/follow', isLoggedIn, limiter, async (req, res, next) => { // Apply rate limiter
  try {
    console.log("✅ 팔로우 요청 받음:", req.params.id); // 요청 ID 확인
    console.log("✅ 현재 로그인한 사용자:", req.user); // 로그인 상태 확인

    const { id } = req.params;
    const me = await User.findByPk(req.user.id);
    const targetUser = await User.findByPk(id);

    if (!targetUser) {
      return res.status(404).json({ message: '해당 사용자를 찾을 수 없습니다.' });
    }

    console.log("✅ 팔로우 대상:", targetUser.nick);

    const isFollowing = await me.hasFollowing(targetUser);
    if (isFollowing) {
      return res.status(400).json({ message: '이미 팔로우한 사용자입니다!' });
    }

    await me.addFollowing(targetUser);
    return res.json({ message: '팔로우 성공!' });
  } catch (error) {
    console.error("🔥 오류 발생:", error);
    next(error);
  }
});


// 팔로우 취소 처리
router.post('/:id/unfollow', isLoggedIn, limiter, async (req, res, next) => { // Apply rate limiter
  try {
    const { id } = req.params;
    const me = await User.findByPk(req.user.id);
    const targetUser = await User.findByPk(id);

    if (!targetUser) {
      return res.status(404).json({ message: '해당 사용자를 찾을 수 없습니다.' });
    }

    const isFollowing = await me.hasFollowing(targetUser);
    if (!isFollowing) {
      return res.status(400).json({ message: '팔로우하지 않은 사용자입니다!' });
    }

    await me.removeFollowing(targetUser);
    return res.json({ message: '팔로우 취소 성공!' });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 모든 사용자 목록 조회 (로그인한 경우에만 접근 가능)
router.get('/list', isLoggedIn, limiter, async (req, res, next) => { // Apply rate limiter
  try {
    const users = await User.findAll();
    res.render('layout', {
      title: '회원 목록',
      users,
      user: req.user
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});



// 사용자 목록 조회 API 수정
router.get('/users', isLoggedIn, limiter, async (req, res) => { // Apply rate limiter
  try {
    const users = await User.findAll();
    const followingIds = req.user.Followings.map(f => f.id); // 로그인한 사용자의 팔로잉 ID 목록

    res.render('users', { 
      users, 
      user: req.user, 
      followingIds // 팔로우한 사용자 ID 목록을 템플릿에 전달
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("서버 오류");
  }
});





//닉네임 변경 api
//수정수정

router.post('/update-nickname', isLoggedIn, limiter, async (req, res) => { // Apply rate limiter
  try {
      const { nickname } = req.body;
      const userId = req.user.id;  // 로그인된 사용자 ID 사용

      if (!nickname) {
          return res.status(400).json({ success: false, message: '닉네임을 입력하세요.' });
      }

      // 닉네임 중복 검사
      const existingUser = await User.findOne({ where: { nick: nickname } });
      if (existingUser) {
          return res.status(400).json({ success: false, message: '이미 존재하는 닉네임입니다.' });
      }

      const user = await User.findByPk(userId);
      if (!user) {
          return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      await user.update({ nick: nickname });

      return res.json({ success: true, nickname });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: '서버 오류' });
  }
});




// 사용자 프로필 조회
// router.get('/user_profile/:username', async (req, res, next) => {
//   try {
//     const { username } = req.params.username;
//     // username으로 사용자 조회
//     const user = await User.findOne({
//       where: { nick: username },
//       include: [
//         { model: User, as: 'Followings' },
//         { model: User, as: 'Followers' }
//       ]
//     });

//     if (!user) {
//       return res.status(404).json({ message: '해당 사용자를 찾을 수 없습니다.' });
//     }

//     // 사용자 프로필 렌더링
//     res.render('user_profile', { user });
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// });



router.get('/user_profile/:username', limiter, async (req, res, next) => { // Apply rate limiter
  try {
    console.log("🔹 현재 로그인한 사용자:", req.user); // 로그 추가
    console.log("🔹 요청된 사용자 프로필:", req.params.username);

    if (!req.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const { username } = req.params;
    const user = await User.findOne({
      where: { nick: username },
      include: [
        { model: User, as: 'Followings' },
        { model: User, as: 'Followers' }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: '해당 사용자를 찾을 수 없습니다.' });
    }

    res.render('user_profile', { user });
  } catch (error) {
    console.error("🔥 프로필 로드 중 오류 발생:", error);
    next(error);
  }
});


/*
router.get('/test', (req, res) => {
  res.send("✅ userRouter 정상 작동 중!");
});
*/


module.exports = router;