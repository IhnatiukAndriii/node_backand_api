import { Request, Response, NextFunction } from 'express';
import { getUserByPhoneNumber, findOrCreateUser } from '../services/user.service';
import { listHabitsByUser, createHabitDirect, updateHabit, deleteHabit } from '../services/habit.service';



export async function getHabits(req: Request, res: Response, next: NextFunction) {
try {
  const phoneNumber = req.query.phone_number as string;

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

export async function createHabitController(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone_number, habit_name, frequency_type, frequency_times } = req.body;

    if (!phone_number || !habit_name || !frequency_type || !frequency_times) {
      return res.status(400).json({ message: 'phone_number, habit_name, frequency_type, and frequency_times are required' });
    }

    const user = await findOrCreateUser(phone_number);
    const habit = await createHabitDirect({
      userId: user.id,
      habit_name,
      frequency_type,
      frequency_times: typeof frequency_times === 'string' ? frequency_times : String(frequency_times),
      status: 'active',
    });

    return res.status(201).json({ habit });
  } catch (error) {
    next(error);
  }
}

export async function updateHabitController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { habit_name, frequency_type, frequency_times, status } = req.body;

    const updatedData: any = {};
    if (habit_name) updatedData.habit_name = habit_name;
    if (frequency_type) updatedData.frequency_type = frequency_type;
    if (frequency_times !== undefined) {
      updatedData.frequency_times = typeof frequency_times === 'number' ? frequency_times : 
        Array.isArray(frequency_times) ? frequency_times : JSON.parse(frequency_times);
    }
    if (status) updatedData.status = status;

    const updated = await updateHabit(Number(id), updatedData);

    if (!updated) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    return res.status(200).json({ habit: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteHabitController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const deleted = await deleteHabit(Number(id));

    if (!deleted) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    return res.status(200).json({ message: 'Habit deleted successfully' });
  } catch (error) {
    next(error);
  }
}