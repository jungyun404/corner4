const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Define rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// GET / -> index.html 파일 제공
router.get('/', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html')); 
});

module.exports = router;