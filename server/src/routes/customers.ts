import { Router } from 'express';
import { customerSchema, idSchema, validate } from '../validation';
import { createCustomer, deleteCustomer, listCustomers } from '../services/customerService';

const router = Router();

router.get('/', (_req, res) => {
  res.json(listCustomers());
});

router.post('/', (req, res) => {
  const result = validate(customerSchema, req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.status(201).json(createCustomer(result.data));
});

router.delete('/:id', (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: 'Invalid customer id' });
    return;
  }
  if (!deleteCustomer(id.data)) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }
  res.status(204).end();
});

export default router;
