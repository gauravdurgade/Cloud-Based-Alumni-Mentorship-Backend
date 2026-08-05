const { cleanEnv, str, port, url } = require('envalid');
require('dotenv').config();

const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
    PORT: port({ default: 5000 }),
    MONGODB_URI: str(),
    JWT_SECRET: str(),
    CLIENT_URL: url({ default: 'http://localhost:3000' }),
    
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: str({ default: '' }),
    CLOUDINARY_API_KEY: str({ default: '' }),
    CLOUDINARY_API_SECRET: str({ default: '' }),
    
    // Email (Nodemailer)
    EMAIL_HOST: str({ default: '' }),
    EMAIL_PORT: str({ default: '2525' }),
    EMAIL_USER: str({ default: '' }),
    EMAIL_PASS: str({ default: '' }),
    EMAIL_FROM: str({ default: 'noreply@cloudalumni.com' }),
    EMAIL_NAME: str({ default: 'Cloud Alumni Platform' })
});

module.exports = env;
