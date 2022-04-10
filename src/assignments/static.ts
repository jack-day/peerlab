import path from 'path';
import { Router } from 'express';

const router = Router();

router.get('/class/:class/new/assignment', (req, res) => {
    res.sendFile('view/screens/new-asgmnt.html', {
        root: path.join(process.cwd(), 'public'),
    });
});

router.get('/class/:class/assignment/:asgmnt', (req, res) => {
    res.sendFile('view/screens/assignment.html', {
        root: path.join(process.cwd(), 'public'),
    });
});

export default router;
