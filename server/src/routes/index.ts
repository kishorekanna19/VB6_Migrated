import { Router } from 'express';
import booksRouter from './books';
import customersRouter from './customers';
import ordersRouter from './orders';
import salesRouter from './sales';

/**
 * Root /api router. Feature routers (login, books, customers, orders, sales,
 * stock, admin) are mounted here.
 */
const apiRouter = Router();

apiRouter.use('/books', booksRouter);
apiRouter.use('/customers', customersRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/sales', salesRouter);

export default apiRouter;
