import { oauth2Client } from '../config/googleAuth.js';

export const authenticateUser = (req, res, next) => {
  if (!req.session.tokens) {
    return res.status(401).json({ 
      error: 'Not authenticated',
      message: 'Please login with Google first'
    });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);
    
    // Check if token is expired
    if (req.session.tokens.expiry_date && req.session.tokens.expiry_date < Date.now()) {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please re-authenticate'
      });
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      message: error.message 
    });
  }
};