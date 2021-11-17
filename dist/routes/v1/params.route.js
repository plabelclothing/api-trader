"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* External modules */
const express_1 = require("express");
/* Locale modules */
const params_1 = require("../../controllers/params");
const router = express_1.Router();
router.put('/trade', params_1.setIsTradeParam);
router.put('/amount', params_1.setCryptoAmountParam);
router.get('/', params_1.getAllParams);
exports.default = router;
