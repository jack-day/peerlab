import path from 'path';
import { Router } from 'express';

const router = Router();

router.get('/class/:class', (req, res) => {
    res.sendFile('view/screens/class.html', {
        root: path.join(process.cwd(), 'public'),
    });
});

router.get('/invite/:invite', (req, res) => {
    res.sendFile('view/screens/invite.html', {
        root: path.join(process.cwd(), 'public'),
    });
});

export default router;
