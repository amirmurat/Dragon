import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MoonSalon API',
      version: '1.0.0',
      description: 'API для системы бронирования услуг в салонах красоты',
      contact: {
        name: 'MoonSalon Support',
        email: 'support@moonsalon.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
      {
        url: 'https://api.moonsalon.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT токен полученный через /auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Код ошибки',
              example: 'unauthorized',
            },
            message: {
              type: 'string',
              description: 'Описание ошибки',
              example: 'Invalid credentials',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            role: {
              type: 'string',
              enum: ['CLIENT', 'PROVIDER', 'ADMIN'],
              example: 'CLIENT',
            },
          },
        },
        Provider: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Beauty Salon',
            },
            address: {
              type: 'string',
              example: '123 Main St, City',
            },
            description: {
              type: 'string',
              example: 'Professional beauty services',
            },
            ratingAvg: {
              type: 'number',
              format: 'float',
              example: 4.5,
            },
          },
        },
        ProviderList: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Provider',
              },
            },
            page: {
              type: 'integer',
              example: 1,
            },
            pageSize: {
              type: 'integer',
              example: 10,
            },
            total: {
              type: 'integer',
              example: 50,
            },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            providerId: {
              type: 'string',
              format: 'uuid',
            },
            providerName: {
              type: 'string',
              example: 'Beauty Salon',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            startAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:00:00Z',
            },
            endAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T11:00:00Z',
            },
            status: {
              type: 'string',
              enum: ['BOOKED', 'CONFIRMED', 'CANCELLED'],
              example: 'BOOKED',
            },
            serviceTitle: {
              type: 'string',
              nullable: true,
              example: 'Haircut',
            },
          },
        },
        AppointmentList: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Appointment',
              },
            },
            page: {
              type: 'integer',
            },
            pageSize: {
              type: 'integer',
            },
            total: {
              type: 'integer',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 6,
              example: 'password123',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 6,
              example: 'password123',
            },
          },
        },
        CreateAppointmentRequest: {
          type: 'object',
          required: ['providerId', 'startAt', 'endAt'],
          properties: {
            providerId: {
              type: 'string',
              format: 'uuid',
            },
            serviceId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            startAt: {
              type: 'string',
              format: 'date-time',
            },
            endAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'UP',
            },
            service: {
              type: 'string',
              example: 'backend',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Эндпоинты для аутентификации и авторизации',
      },
      {
        name: 'Providers',
        description: 'Управление провайдерами услуг',
      },
      {
        name: 'Appointments',
        description: 'Управление бронированиями',
      },
      {
        name: 'Admin',
        description: 'Административные функции',
      },
      {
        name: 'System',
        description: 'Системные эндпоинты',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/index.js'],
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MoonSalon API Documentation',
  }));
}
