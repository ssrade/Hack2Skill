import swaggerJSDoc from 'swagger-jsdoc'
import path from 'path'

const options: any = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hack2Skill Backend API',
      version: '1.0.0',
      description: 'API documentation for the Hack2Skill backend'
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: 'Local server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        SignupRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
            name: { type: 'string' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                email: { type: 'string' },
                name: { type: 'string' },
                profilePhoto: { type: 'string', nullable: true }
              }
            }
          }
        }
      }
    }
  },
  // In production the TypeScript sources are compiled to `dist` and the
  // runtime should read JSDoc from the compiled JS files. In development
  // we read the `.ts` files so editors show correct locations.
  apis: (process.env.NODE_ENV === 'production')
    ? [path.join(process.cwd(), 'dist/models/**/*.js')]
    : [path.join(process.cwd(), 'src/models/**/*.ts')]
}

const swaggerSpec = swaggerJSDoc(options)

export default swaggerSpec