import { json } from 'express';
import PromiseRouter from 'express-promise-router';
import multer from 'multer';
import path from 'path';
import validate from 'src/validation';
import * as val from './validation';
import * as work from './controllers';

const router = PromiseRouter();
const upload = multer({ dest: path.join('uploads', 'work') });

router.use(json());
router.post('/work', validate(val.postSchema), work.post);
router.get('/work/:work', validate(val.schema), work.get);
router.put('/work/:work', validate(val.updateSchema), work.put);
router.put('/work/:work/file', upload.single('file'), validate(val.pdfSchema), work.fileUpload);

export default router;
