import dotenv from 'dotenv';
dotenv.config();

export const config = {
  google: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]
  },
  session: {
    secret: process.env.SESSION_SECRET
  },
  client: {
    url: process.env.CLIENT_URL
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY
  }
};