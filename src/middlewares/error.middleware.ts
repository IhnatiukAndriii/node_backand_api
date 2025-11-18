import { Request, Response, NextFunction } from 'express';

// Basic centralized error handling middleware
export default function errorMiddleware(
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
) {
	// eslint-disable-next-line no-console
	console.error(err);
	res.status(500).json({ message: 'Internal server error' });
}