const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const nunjucks = require('nunjucks');
const passport = require('passport');

dotenv.config();
const indexRouter = require('./routes');
const pageRouter = require('./routes/page');
const { sequelize } = require('./models');
const authRouter = require('./routes/auth');
const passportConfig = require('./passport');
const userRouter = require('./routes/user');

const bookRouter = require("./routes/book");
const postsRouter = require("./routes/posts");
const commentsRouter = require("./routes/comments");
const booklist = require('./routes/booklist');
const booklumi = require('./routes/booklumi'); 
const imageRouter = require('./routes/image');  // image 라우터 추가


const { User } = require('./models'); // User 모델을 임포트
const { Follow } = require('./models');  // Follow 모델 임포트
const { Intro } = require('./models');  // Intro 모델 임포트

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
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    domain: 'example.com', // Set your domain
    path: '/', // Set path to root
    expires: new Date(Date.now() + 60 * 60 * 1000), // Set expiration to 1 hour
  },
  name: 'session-cookie',
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', pageRouter);
app.use('/auth', authRouter);
app.use('/user', userRouter);

app.use("/book", bookRouter);
app.use("/posts", postsRouter);
app.use("/comments", commentsRouter);
app.use('/api/booklist', booklist);
app.use('/api/booklumi', booklumi);  
app.use('/image', imageRouter);  // /image 경로에서 이미지 업로드 라우터 처리
app.use('/user_profile', userRouter);


app.get('/user_profile/:username', async (req, res) => {
  const username = req.params.username;  // URL에서 'username'을 받아옴
  
  // 'nick'을 기준으로 사용자 정보 조회
  const user = await User.findOne({
    where: { nick: username },  // 닉네임으로 사용자 조회
    include: [
      {
        model: User,
        as: 'Followers',  // 팔로워 목록을 가져옴
        attributes: ['nick'],  // 팔로워의 닉네임만 가져옴
      },
      {
        model: User,
        as: 'Followings',  // 팔로잉 목록을 가져옴
        attributes: ['nick'],  // 팔로잉의 닉네임만 가져옴
      }
    ],
  });

  if (!user) {
    return res.status(404).send('사용자를 찾을 수 없습니다.');
  }

  // 유저의 정보를 'user_profile' 템플릿에 전달하여 렌더링
  res.render('user_profile', {
    user,
    followers: user.Followers,  // 팔로워 목록
    followings: user.Followings,  // 팔로잉 목록
  });
});

// 서버 실행
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




// 동적 렌더링
const fs = require('fs');

app.get('/:page', (req, res) => {
  const page = req.params.page;
  const allowedPages = ['home', 'about', 'contact']; // Allow list for pages

  if (!allowedPages.includes(page)) {
    return res.status(403).send('Forbidden');
  }

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

// 회원가입 처리(POST 요청)
app.post('/join', (req, res) => {
  const { username, password } = req.body;
  
  // 회원가입 로직 예시
  if (username !== 'user' || password !== 'password') {
    return res.redirect('/join?error=true');  // 실패 시, error=true 쿼리 파라미터와 함께 리다이렉트
  }

  // 회원가입 성공 시
  res.redirect('/auth/login');
});

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


// / 경로로 접속하면 /index로 리다이렉트
app.get('/', (req, res) => {
  res.redirect('/index');
});

// 로그인한 사용자만 한줄소개 폼 볼수있게 하기위함
app.get('/', (req, res) => {
  res.render('main', {
    user: req.user,  // 로그인한 사용자 정보 (로그인 상태 확인용)
  });
});



// 한줄소개 저장
app.post('/save-intro', async (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;  // 로그인된 사용자의 ID

  // 글이 비어있는지 확인
  if (!content) {
    return res.status(400).send('내용을 입력해주세요.');
  }

  try {
    // 짧은 글 저장
    await Intro.create({
      content,
      userId,
    });

    // 저장된 데이터를 클라이언트로 반환
    const intros = await Intro.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']], // 최신 글 먼저 보여주기
    });

    res.status(200).json(intros);  // 저장된 모든 데이터를 클라이언트로 응답
  } catch (err) {
    console.error(err);
    res.status(500).send('서버 오류');
  }
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