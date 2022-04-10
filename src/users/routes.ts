import { json } from 'express';
import PromiseRouter from 'express-promise-router';
import multer from 'multer';
import path from 'path';
import validate, { requireAccount } from 'src/validation';
import * as val from './validation';
import * as users from './controllers';

const router = PromiseRouter();
const upload = multer({ dest: path.join('uploads', 'users', 'avatars') });

router.use(json());
router.post('/users', validate(val.postSchema), users.post);
router.get('/users/:user', validate(val.getSchema), users.get);
router.get('/me', requireAccount, users.getMe);
router.put('/me', validate(val.putMeSchema), users.putMe);
router.delete('/me', requireAccount, users.deleteMe);
router.get('/me/registered', users.meRegistered);
router.get('/me/avatar', requireAccount, users.getMeAvatar);
router.put('/me/avatar', upload.single('avatar'), validate(val.avatarSchema), users.meAvatar);

export default router;
