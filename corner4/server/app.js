const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const nunjucks = require('nunjucks');
const passport = require('passport');
const helmet = require('helmet');
const csurf = require('csurf');

dotenv.config();
const indexRouter = require('./routes');
const pageRouter = require('./routes/page');
const { sequelize } = require('./models');
const authRouter = require('./routes/auth');
const passportConfig = require('./passport');
const userRouter = require('./routes/user');
const bookRouter = require("./routes/book");
const postsRouter = require("./routes/posts");
// 설문 라우터 추가 
const booklumiRouter = require('./routes/booklumi');
// 책 추천 라우터 추가  
const bookRecommendationRouter = require('./routes/bookRecommendation');  

const { User } = require('./models'); // User 모델을 임포트
const { Follow } = require('./models');  // Follow 모델 임포트

const app = express();
app.use('/api', indexRouter);  //FE에서 작성
app.set('port', process.env.PORT || 3002);  //node 서버가 사용할 포트 번호, 리액트의 포트번호(3000)와 충돌하지 않게 다른 번호로 할당

passportConfig(); // 패스포트 설정

// 템플릿 엔진 설정
app.set('view engine', 'html');
nunjucks.configure('views', { 
  express: app,
  watch: true,
});

sequelize.sync({ force: false })
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });

  //미들웨어 설정
app.use(helmet());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: true, // Set secure to true
  },
  name: 'session-cookie',
}));
app.use(csurf()); // Enable CSRF protection

app.use(passport.initialize());
app.use(passport.session());

app.use('/', pageRouter);
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use("/book", bookRouter);
app.use("/posts", postsRouter);
// booklumi 라우터 등록 
app.use('/api/booklumi', booklumiRouter); 
// 책 추천 라우터 등록 
app.use('/api/bookRecommendation', bookRecommendationRouter); 

// 동적 렌더링
const fs = require('fs');

app.get('/:page', (req, res) => {
  const page = path.basename(req.params.page); // Sanitize input
  const filePath = path.join(__dirname, 'views', `${page}.html`);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).send('Page not found');
    } else {
      res.render(page);  // 해당 페이지를 렌더링
    }
  });
});


// 로그인 페이지(GET 요청)
// app.get('/join', (req, res) => {
//   // 쿼리 파라미터에 error=true가 있을 때, 로그인 실패 메시지를 보여주기 위해 전달
//   const error = req.query.error === 'true'; // error가 true일 때 실패 메시지 표시
//   res.render('views/join', { error });
// });

// 로그인 처리(POST 요청)
app.post('/join', (req, res) => {
  const { username, password } = req.body;
  
  // 로그인 로직 예시
  if (username !== 'user' || password !== 'password') {
    return res.redirect('/join?error=true');  // 실패 시, error=true 쿼리 파라미터와 함께 리다이렉트
  }

  // 로그인 성공 시
  res.redirect('/');
});

// 로그인 처리 (POST 요청)
// app.post('/join', (req, res, next) => {
//   passport.authenticate('local', (err, user, info) => {
//     if (err || !user) {
//       // 로그인 실패 시, 상태 코드 401로 응답을 보냄
//       return res.status(401).json({ message: '로그인 실패: 잘못된 사용자명이나 비밀번호입니다.' });
//     }
//     req.logIn(user, (err) => {
//       if (err) return next(err);
//       return res.redirect('/'); // 로그인 성공 시 홈으로 리다이렉트
//     });
//   })(req, res, next);
// });




// 회원 목록 조회
app.get('/users', (req, res) => {
  User.findAll()
    .then(users => {
      res.render('layout', { 
        title: '회원 목록', 
        users: users,
        user: req.user,
        myId: req.user ? req.user.id : null // 로그인한 사용자의 ID
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("서버 오류");
    });
});


// 팔로우 처리
app.post('/follow', (req, res) => {
  const followerId = req.user.id;  // 현재 로그인한 사용자의 ID
  const followingId = req.body.userId;  // 팔로우하려는 사용자의 ID
  
  // 이미 팔로우 중인지 확인
  Follow.findOrCreate({
    where: { followerId, followingId }
  })
    .then(([follow, created]) => {
      if (created) {
        res.send('팔로우 성공');
      } else {
        res.send('이미 팔로우한 사용자입니다');
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("서버 오류");
    });
});



app.use((req, res, next) => {
  res.status(404).send('Not Found');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err.message);
});

app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기 중');
});