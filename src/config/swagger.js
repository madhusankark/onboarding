const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const env = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Service Provider Onboarding Portal API',
      version: '1.0.0',
      description:
        'REST API for onboarding service providers. Includes authentication, provider profile management, document uploads, and admin review workflows.'
    },
    servers: [
      { url: `http://localhost:${env.port}/api`, description: 'Local server' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [path.join(__dirname, '..', 'routes', '*.js')]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;