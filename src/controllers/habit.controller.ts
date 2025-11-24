import { Request, Response, NextFunction } from 'express';
import { getUserByPhoneNumber } from '../services/user.service';
import { listHabitsByUser} from '../services/habit.service';



export async function getHabits(req: Request, res: Response, next: NextFunction) {
try {
  const phoneNumber = req.params.phone_number;

  if (!phoneNumber) { 
    return res.status(400).json({ message: 'phone_number is required' });
     };
     const user = await getUserByPhoneNumber(phoneNumber);
      if (!user) {
        return res.status(404).json({message: 'User not found'})
      }
    const habits =  await listHabitsByUser (user.id);
    
    return res.status(200).json({ habits: habits });}
    catch (error) {
      next (error);}
}