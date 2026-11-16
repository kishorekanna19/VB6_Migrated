import { Router } from 'express';

/**
 * Root /api router. Feature routers (login, books, customers, orders, sales,
 * stock, admin) are mounted here.
 */
const apiRouter = Router();

export default apiRouter;
