import { json } from 'express';
import PromiseRouter from 'express-promise-router';
import multer from 'multer';
import path from 'path';
import validate, { requireAccount } from 'src/validation';
import * as val from './validation';
import * as classes from './controllers';

const router = PromiseRouter();
const upload = multer({ dest: path.join('uploads', 'classes', 'avatars') });

router.use(json());
router.get('/classes', requireAccount, classes.get);
router.post('/classes', validate(val.postSchema), classes.post);
router.get('/classes/:class', validate(val.schema), classes.getClass);
router.put('/classes/:class', validate(val.putSchema), classes.put);
router.delete('/classes/:class', validate(val.ownerSchema), classes.del);
router.put('/classes/:class/avatar', upload.single('avatar'), validate(val.avatarSchema), classes.putAvatar);
router.get('/classes/:class/short-name', classes.shortName);
router.get('/classes/:class/members', validate(val.schema), classes.members);
router.delete('/classes/:class/members/:user', validate(val.deleteMemberSchema), classes.deleteMember);
router.post('/classes/:class/invites', validate(val.ownerSchema), classes.postInviteClass);
router.get('/invites/:invite', validate(val.inviteSchema), classes.getInvite);
router.post('/invites/:invite', validate(val.postInviteSchema), classes.postInvite);

export default router;
