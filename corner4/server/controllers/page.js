const { User, Post, Hashtag } = require('../models');
const rateLimit = require('express-rate-limit');

// Apply rate limiting to expensive operations
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

exports.renderProfile = (req, res) => {
    res.render('profile', { title: '나의 서랍' });
    };
    
    exports.renderJoin = (req, res) => {
    res.render('join', { title: '회원가입' });
    };
    
    exports.renderMain = (req, res, next) => {
    const twits = [];
    res.render('main', {
        title: '마이북플래닛',
        twits,
    });
};

exports.renderHashtag = [limiter, async (req, res, next) => {
    const query = req.query.hashtag;
    if (!query) {
      return res.redirect('/');
    }
    try {
      const hashtag = await Hashtag.findOne({ where: { title: query } });
      let posts = [];
      if (hashtag) {
        posts = await hashtag.getPosts({ include: [{ model: User }] });
      }
  
      return res.render('main', {
        title: `${query} | 마이북플래닛`,
        twits: posts,
      });
    } catch (error) {
      console.error(error);
      return next(error);
    }
  }];