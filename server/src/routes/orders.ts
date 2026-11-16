import { Router } from 'express';
import { idSchema, orderSchema, validate } from '../validation';
import { createOrder, deleteOrder, listOrders } from '../services/orderService';

const router = Router();

router.get('/', (_req, res) => {
  res.json(listOrders());
});

router.post('/', (req, res) => {
  const result = validate(orderSchema, req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.status(201).json(createOrder(result.data));
});

router.delete('/:id', (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: 'Invalid order id' });
    return;
  }
  if (!deleteOrder(id.data)) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.status(204).end();
});

export default router;
