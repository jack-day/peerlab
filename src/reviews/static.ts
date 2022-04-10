import path from 'path';
import { Router } from 'express';

const router = Router();

router.get('/class/:class/assignment/:asgmnt/peer-review', (req, res) => {
    res.sendFile('view/screens/peer-review.html', {
        root: path.join(process.cwd(), 'public'),
    });
});

export default router;
