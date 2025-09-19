const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agent Wallboard API',
      version: '1.0.0',
      description: 'API สำหรับจัดการ agent และสถานะ',
    },
    servers: [{ url: 'http://localhost:3001/api' }],
  },
  apis: ['./routes/*.js'], // JSDoc annotations
};

const specs = swaggerJsdoc(options);
module.exports = { swaggerUi, specs };