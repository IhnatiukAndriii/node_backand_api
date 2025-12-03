import express from 'express';
import cors from 'cors';
import routes from './routes';
import errorMiddleware from './middlewares/error.middleware';
import { requestIdMiddleware } from './middlewares/requestId.middleware';

const app = express();

app.use(requestIdMiddleware);
app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.use(errorMiddleware);

export { app };
