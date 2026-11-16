import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import adminRouter from './admin';
import authRouter from './auth';
import booksRouter from './books';
import customersRouter from './customers';
import ordersRouter from './orders';
import salesRouter from './sales';

/**
 * Root /api router. Feature routers (login, books, customers, orders, sales,
 * stock, admin) are mounted here.
 */
const apiRouter = Router();

// Public: login (logout checks the token itself).
apiRouter.use('/auth', authRouter);

// Everything below requires a valid Bearer token.
apiRouter.use(requireAuth);

apiRouter.use('/admin', adminRouter);
apiRouter.use('/books', booksRouter);
apiRouter.use('/customers', customersRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/sales', salesRouter);

export default apiRouter;
