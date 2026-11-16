import { Router } from 'express';
import { idSchema, userSchema, userUpdateSchema, validate } from '../validation';
import {
  createUser,
  deleteUser,
  DuplicateUserError,
  getUser,
  listUsers,
  updateUser,
} from '../services/userService';

/** frmAdminSetting: management of the UserDetails table. */
const router = Router();

router.get('/users', (_req, res) => {
  res.json(listUsers());
});

router.get('/users/:id', (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }
  const user = getUser(id.data);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

router.post('/users', (req, res) => {
  const result = validate(userSchema, req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  try {
    res.status(201).json(createUser(result.data));
  } catch (err) {
    if (err instanceof DuplicateUserError) {
      res.status(409).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.put('/users/:id', (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }
  const result = validate(userUpdateSchema, req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  try {
    const user = updateUser(id.data, result.data);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    if (err instanceof DuplicateUserError) {
      res.status(409).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.delete('/users/:id', (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }
  if (!deleteUser(id.data)) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.status(204).end();
});

export default router;
