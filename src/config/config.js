require('dotenv').config();

const config = {
  app: {
    name: 'MyJobHunting',
    port: process.env.PORT || 3001,
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  
  database: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'choice_talent_dev',
    username: process.env.DB_USER || 'choice_talent_user',
    password: process.env.DB_PASSWORD || 'choice_talent_password',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    passwordResetExpiresIn: '1h'
  },
  
  email: {
    // Use generic SMTP by default; set EMAIL_SERVICE=gmail only if you want Gmail
    service: process.env.EMAIL_SERVICE || 'smtp',
    host: process.env.EMAIL_HOST || 'mail.choicetalents.com.ng',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : true,
    user: process.env.EMAIL_USER || 'noreply@choicetalents.com.ng',
    password: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'MyJobHunting <noreply@choicetalents.com.ng>'
  },
  
  security: {
    bcryptRounds: 12,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100, // limit each IP to 100 requests per windowMs
    corsOptions: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://choicetalent.netlify.app',
        'https://*.netlify.app'
      ],
      credentials: true
    }
  }
};

module.exports = config; 