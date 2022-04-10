import PromiseRouter from 'express-promise-router';
import validate from 'src/validation';
import { schema as classSchema } from 'src/classes/validation';
import * as val from './validation';
import * as asgmnts from './controllers';

const router = PromiseRouter();

router.get('/classes/:class/assignments', validate(classSchema), asgmnts.getAll);
router.post('/classes/:class/assignments', validate(val.postSchema), asgmnts.post);
router.get('/classes/:class/assignments/:asgmnt', validate(val.schema), asgmnts.get);
router.put('/classes/:class/assignments/:asgmnt', validate(val.putSchema), asgmnts.put);
router.delete('/classes/:class/assignments/:asgmnt', validate(val.deleteSchema), asgmnts.del);
router.get('/classes/:class/assignments/:asgmnt/peer-work', validate(val.peerWorkSchema), asgmnts.peerWork);

export default router;
