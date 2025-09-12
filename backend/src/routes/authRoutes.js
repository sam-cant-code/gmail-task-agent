    import express from 'express';
import { getAuthUrl, getTokens } from '../config/googleAuth.js';
import { config } from '../config/config.js';

const router = express.Router();

// Initiate Google OAuth
router.get('/google', (req, res) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${config.client.url}?error=no_code`);
  }

  try {
    const tokens = await getTokens(code);
    req.session.tokens = tokens;
    req.session.isAuthenticated = true;
    
    res.redirect(`${config.client.url}?success=true`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${config.client.url}?error=auth_failed`);
  }
});

// Check authentication status
router.get('/status', (req, res) => {
  res.json({
    isAuthenticated: req.session.isAuthenticated || false,
    user: req.session.user || null
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;