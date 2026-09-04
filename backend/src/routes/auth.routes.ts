import { Router } from 'express';
import { authService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth';
import { logger } from '../config/logger';

export const authRoutes = Router();

// POST /api/auth/login
authRoutes.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const result = await authService.login(username, password);
  if (!result) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json(result);
});

// POST /api/auth/change-password (protected)
authRoutes.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }
  const ok = await authService.changePassword(req.user!.userId, currentPassword, newPassword);
  if (!ok) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  logger.info({ userId: req.user!.userId }, 'Admin password changed');
  res.json({ message: 'Password changed successfully' });
});
