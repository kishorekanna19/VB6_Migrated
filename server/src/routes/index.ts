import { Router } from 'express';
import booksRouter from './books';

/**
 * Root /api router. Feature routers (login, books, customers, orders, sales,
 * stock, admin) are mounted here.
 */
const apiRouter = Router();

apiRouter.use('/books', booksRouter);

export default apiRouter;
