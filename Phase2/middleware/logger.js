// middleware/logger.js
const logger = (req, res, next) => {
  const start = process.hrtime(); // ใช้ high-resolution timer

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);

    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;

    console.log(`📡 [${timestamp}] ${method} ${url} ${status} - ${durationMs}ms`);
  });

  next();
};

module.exports = logger;