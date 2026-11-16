import { Router } from 'express';
import { saleLineSchema, validate } from '../validation';
import { SaleValidationError, createSale, listSales } from '../services/salesService';

const router = Router();

router.get('/', (_req, res) => {
  res.json(listSales());
});

router.post('/', (req, res) => {
  const result = validate(saleLineSchema, req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  try {
    res.status(201).json(createSale(result.data));
  } catch (err) {
    if (err instanceof SaleValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
