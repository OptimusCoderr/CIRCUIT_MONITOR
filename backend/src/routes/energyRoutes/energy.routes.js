// routes/energy.routes.js
import express from 'express';
import {
  createEnergyData,
  createSingleEnergyData,
  getAggregatedData,
  getFlattenedReadings,

} from '../../controllers/energyControllers/energy.controller.js';
import { protectRoute } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.post('/energy-data', createEnergyData); // Batch creation
router.post('/energy-data/single', createSingleEnergyData); // Single reading
router.get('/energy-data/flattened', getFlattenedReadings); // All individual readings
router.get('/energy-data/aggregated', getAggregatedData); // Aggregated for charts

export default router;