import {Router} from 'express';
import { Request, Response, NextFunction  } from 'express';
import { markHabitComplete, getCompletionHistory, deleteCompletion } from '../services/complection.service';

const router = Router();

router.post('/', async(req: Request, res: Response, next: NextFunction) =>{
  try{
    const { habit_id, user_id,scheduled_time, note } = req.body

    if(!habit_id || !user_id){
        return res.status(400).json({
            message: 'habit_id and user_id are requied',
        });
    }
  
const habit = await markHabitComplete(
    user_id,
    habit_id,
    scheduled_time,
    note
);
return res.status(201).json({
    message: 'Habit marked as complete ',
    completion: habit,
});
} catch (error){
    next(error);
}
});


router.get('/:habit_id', async(req: Request, res: Response, next: NextFunction)=> {
  try {
    const habitId = parseInt(req.params.habitId) 
    const { startDate, endDate} = req.query;

    const start = startDate ? new Date(startDate as string): undefined;
    const end = endDate ? new Date(endDate as string ):undefined;

    const history = await getCompletionHistory(habitId, start, end);

    return res.status(200).json({
      habit_id: habitId,
      completions: history,
    });
  } catch(error){
    next(error);
  }
});

router.delete('/:id', async (req:Request, res: Response, next: NextFunction)=> {
    try{

        const completionId = parseInt(req.params.id);

        await deleteCompletion(completionId);

        return res.status(200).json({
            mesagge: 'Completions delete successfuly',
        });
    } catch(error){
        next(error);
    }
});

export default router;

