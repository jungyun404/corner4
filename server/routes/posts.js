const express = require("express");
const router = express.Router();
const { Post, User, Like } = require("../models"); // ✅ Like 모델 추가
const { Op } = require("sequelize");
const rateLimit = require("express-rate-limit"); // Import rate limiting middleware

// Apply rate limiting to all routes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});

router.use(limiter); // Apply the rate limiter to all routes

// 📌 [1] 게시글 목록 조회 + 검색 기능 (GET /posts)
router.get("/", async (req, res) => {
    try {
        const { search } = req.query;
        let whereCondition = {};

        // Ensure search is a string
        if (search && typeof search === 'string') {
            whereCondition = {
                [Op.or]: [
                    { bookTitle: { [Op.like]: `%${search}%` } },  // 책 제목 검색
                    { reviewTitle: { [Op.like]: `%${search}%` } } // 감상평 제목 검색
                ]
            };
        }

        const posts = await Post.findAll({
            where: whereCondition,
            include: [{
                model: User,
                as: "user",
                attributes: ["id", "nick"]
            }],
            order: [["createdAt", "DESC"]],
        });

        res.render("posts", { posts, search });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});


// 📌 [2] 게시글 작성 기능 (POST /posts)
router.post("/", async (req, res) => {  
    try {
        const { bookTitle, reviewTitle, content, rating } = req.body;

        if (!req.user) {
            return res.status(401).json({ message: "로그인이 필요합니다." });
        }

        if (!bookTitle || !reviewTitle || !content || rating === undefined) {
            return res.status(400).json({ message: "모든 필드를 입력해야 합니다." });
        }

        // ✅ 새 게시글 생성
        const newPost = await Post.create({
            bookTitle,
            reviewTitle,
            content,
            rating,
            userId: req.user.id, // 로그인한 사용자의 ID
        });

        res.redirect("/posts");  // 🚀 게시글 목록으로 리다이렉트
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

// 📌 [3] 게시글 작성 페이지 (GET /posts/new)
router.get("/new", async (req, res) => {
    try {
        res.render("posts_create"); // posts_create.html을 렌더링
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

// 📌 [4] 게시글 상세 조회 (GET /posts/:id)
router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findOne({
            where: { id: req.params.id },
            include: [{
                model: User,
                as: "user",
                attributes: ["id", "nick"]
            }]
        });

        if (!post) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        // ✅ 현재 게시글의 좋아요 개수 가져오기
        const likeCount = await Like.count({ where: { postId: post.id } });

        // ✅ 사용자가 좋아요를 눌렀는지 확인
        let userLiked = false;
        if (req.user) {
            userLiked = await Like.findOne({ where: { postId: post.id, userId: req.user.id } });
        }

        res.render("posts_detail", { post, user: req.user, likeCount, userLiked });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

// 📌 [5] 게시글 좋아요 기능 (POST /posts/:id/like)
router.post("/:id/like", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "로그인이 필요합니다." });
        }

        const post = await Post.findByPk(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        const existingLike = await Like.findOne({ where: { postId: post.id, userId: req.user.id } });

        if (existingLike) {
            await existingLike.destroy(); // 좋아요 취소
            return res.json({ message: "좋아요 취소", liked: false });
        } else {
            await Like.create({ postId: post.id, userId: req.user.id }); // ✅ 좋아요 추가
            return res.json({ message: "좋아요!", liked: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});
// 📌 [6] 게시글 수정 페이지 (GET /posts/:id/edit)
router.get("/:id/edit", async (req, res) => {
    try {
        const post = await Post.findOne({
            where: { id: req.params.id },
            include: [{ model: User, as: "user", attributes: ["id", "nick"] }]
        });

        if (!post) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        // ✅ 작성자 본인만 수정 가능하도록 체크
        if (req.user.id !== post.userId) {
            return res.status(403).json({ message: "수정 권한이 없습니다." });
        }

        res.render("posts_edit", { post }); // 수정 페이지 렌더링
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});
// 📌 [7] 게시글 수정 처리 (POST /posts/:id/edit)
router.post("/:id/edit", async (req, res) => {
    try {
        const { bookTitle, reviewTitle, content, rating } = req.body;

        const post = await Post.findOne({ where: { id: req.params.id } });

        if (!post) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        // ✅ 작성자 본인만 수정 가능하도록 체크
        if (req.user.id !== post.userId) {
            return res.status(403).json({ message: "수정 권한이 없습니다." });
        }

        // ✅ 게시글 수정
        await Post.update(
            { bookTitle, reviewTitle, content, rating },
            { where: { id: req.params.id } }
        );

        res.redirect(`/posts/${req.params.id}`); // 🚀 수정 후 상세 페이지로 이동
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});
// 📌 [8] 게시글 삭제 기능 (POST /posts/:id/delete)
router.post("/:id/delete", async (req, res) => {
    try {
        const post = await Post.findOne({ where: { id: req.params.id } });

        if (!post) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        // 작성자 본인만 삭제 가능
        if (req.user.id !== post.userId) {
            return res.status(403).json({ message: "삭제 권한이 없습니다." });
        }

        // ✅ 관련된 likes 데이터 삭제
        await Like.destroy({ where: { postId: post.id } });

        // ✅ 게시글 삭제
        await Post.destroy({ where: { id: post.id } });

        res.redirect("/posts"); // 🚀 삭제 후 게시글 목록으로 이동
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});


module.exports = router;