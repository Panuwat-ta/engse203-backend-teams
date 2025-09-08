// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 นาที
  max: 10, // จำกัด 10 requests ต่อ IP ต่อ window สำหรับทดสอบ
  standardHeaders: true, // ส่ง header rate-limit กลับไปด้วย
  legacyHeaders: false,  // ปิด X-RateLimit-* headers แบบเก่า
  message: {
    success: false,
    message: '⏳ Too many requests. Please try again later.'
  }
});

module.exports = apiLimiter;