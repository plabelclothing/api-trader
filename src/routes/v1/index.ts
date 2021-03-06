'use strict';
/* External modules */
import {Router} from 'express';
/* Locale modules */
import check from './check.route';
import params from './params.route';

const router = Router();

router.use('/check', check);
router.use('/params', params);


export default router;
