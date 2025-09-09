const xss = require('xss');
const validator = require('validator');

function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        let value = obj[key].trim();
        value = xss(value); // ป้องกัน XSS
        value = validator.escape(value); // ป้องกัน HTML injection
        obj[key] = value;
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
}

module.exports = sanitizeInput;