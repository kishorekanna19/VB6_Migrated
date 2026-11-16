import { Router } from 'express';
import { getAuthUser, requireAuth, revokeToken, signToken } from '../middleware/auth';
import { authenticate } from '../services/userService';
import { loginSchema, validate } from '../validation';

const router = Router();

/** POST /api/auth/login — LoginForm: validates UserName/Password against UserDetails. */
router.post('/login', (req, res) => {
  const result = validate(loginSchema, req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  const user = authenticate(result.data.userName, result.data.password);
  if (!user) {
    res.status(401).json({ error: 'Invalid user name or password' });
    return;
  }
  res.json({ token: signToken(user), user });
});

/** POST /api/auth/logout — frmMain.cmdLogout; invalidates the presented token. */
router.post('/logout', requireAuth, (_req, res) => {
  const user = getAuthUser(res);
  revokeToken(user.jti, user.exp);
  res.json({ message: 'Logged out' });
});

export default router;
