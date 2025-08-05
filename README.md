# Choice Talent Backend API

A secure, scalable backend API built with Express.js, Sequelize, and PostgreSQL for the Choice Talent application.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with password reset
- 🗄️ **Database**: PostgreSQL with Sequelize ORM
- 🛡️ **Security**: Password hashing, rate limiting, input validation
- 📧 **Email**: Password reset and welcome emails
- 🧪 **Testing**: Comprehensive test suite with Jest
- 📚 **Documentation**: Well-documented API endpoints
- 🚀 **Production Ready**: Environment-based configuration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Email**: Nodemailer

## Quick Start

### Prerequisites

- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   # Create databases
   createdb choice_talent_dev
   createdb choice_talent_test

   # Run migrations (optional - auto-sync in development)
   npm run db:migrate
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   Server runs on `http://localhost:3001`

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment | No | development |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRES_IN` | Token expiration | No | 1d |
| `EMAIL_HOST` | SMTP host | Yes | - |
| `EMAIL_PORT` | SMTP port | No | 587 |
| `EMAIL_USER` | SMTP username | Yes | - |
| `EMAIL_PASS` | SMTP password | Yes | - |
| `FRONTEND_URL` | Frontend URL for CORS | No | http://localhost:3000 |

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register new user | No |
| `POST` | `/api/auth/login` | Login user | No |
| `POST` | `/api/auth/logout` | Logout user | Yes |
| `POST` | `/api/auth/forgot-password` | Request password reset | No |
| `POST` | `/api/auth/reset-password` | Reset password with token | No |
| `GET` | `/api/auth/profile` | Get current user profile | Yes |

### User Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/user/profile` | Get user profile | Yes |
| `PUT` | `/api/user/profile` | Update user profile | Yes |
| `POST` | `/api/user/change-password` | Change password | Yes |
| `DELETE` | `/api/user/account` | Delete account | Yes |
| `GET` | `/api/user/dashboard` | Get dashboard data | Yes |

### Example Requests

#### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "John Doe"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

#### Authenticated Request
```bash
curl -X GET http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Run database seeds
- `npm run db:reset` - Reset database

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── server.js        # App entry point
├── tests/               # Test files
├── .env.example         # Environment variables template
├── package.json
└── README.md
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configurable cross-origin requests
- **Helmet.js**: Security headers
- **Environment Variables**: Sensitive data protection

## Production Deployment

1. **Environment Setup**
   - Set production environment variables
   - Configure PostgreSQL database
   - Set up email service (SMTP)

2. **Database Migration**
   ```bash
   NODE_ENV=production npm run db:migrate
   ```

3. **Start Application**
   ```bash
   npm start
   ```

## Contributing

1. Follow the coding standards in `/rules/implementation.mdc`
2. Write tests for new features
3. Update documentation
4. Ensure all tests pass before committing

## License

MIT License - see LICENSE file for details 