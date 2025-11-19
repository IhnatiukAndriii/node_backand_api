import { Request, Response, NextFunction } from 'express';
export async function handlePrompt(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { text, phone_number } = req.body;

    if (!text || !phone_number) {
      return res.status(400).json({
        message: 'text and phone_number are required',
      });
    }

    return res.status(200).json({
      receiveText: text,
      receivePhoneNumber: phone_number,
    });
  } catch (error) {
    next(error);
  }
}