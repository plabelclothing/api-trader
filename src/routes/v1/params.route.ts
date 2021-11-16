/* External modules */
import {Router} from 'express';

/* Locale modules */
import {setCryptoAmountParam, getAllParams, setIsTradeParam} from '../../controllers/params';

const router = Router();

router.put('/trade', setIsTradeParam);
router.put('/amount', setCryptoAmountParam);
router.get('/', getAllParams);

export default router;
