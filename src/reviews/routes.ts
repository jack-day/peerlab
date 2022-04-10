import PromiseRouter from 'express-promise-router';
import validate from 'src/validation';
import { schema as workSchema } from 'src/work/validation';
import * as val from './validation';
import * as review from './controllers';

const router = PromiseRouter();

router.get('/work/:work/reviews', validate(workSchema), review.getAll);
router.post('/work/:work/reviews', validate(val.postSchema), review.post);
router.put('/work/:work/reviews/:reviewer/likes', validate(val.schema), review.likes);
router.put('/work/:work/reviews/:reviewer/dislikes', validate(val.schema), review.dislikes);
router.delete('/work/:work/reviews/:reviewer/likes', validate(val.schema), review.deleteLike);
router.delete('/work/:work/reviews/:reviewer/dislikes', validate(val.schema), review.deleteLike);

export default router;
