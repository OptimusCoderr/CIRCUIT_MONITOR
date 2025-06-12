import express from 'express';
import {
  createCircuit,
  toggleCircuit,
  updateVoltageAndPower,
  getAllCircuits,
  getSingleCircuit,
  editCircuit,
  deleteCircuit,
  getVoltageAndPower
} from '../../controllers/CircuitControllers/circuit.controller.js';
import { protectRoute } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.route('/create-circuit')
  .post(protectRoute, createCircuit)
  .get(protectRoute, getAllCircuits);

router.route('/:id')
  .get(protectRoute, getSingleCircuit)
  .put(protectRoute, editCircuit)
  .delete(protectRoute, deleteCircuit);

router.post('/:id/toggle', protectRoute, toggleCircuit);
router.post('/:id/update-power', protectRoute, updateVoltageAndPower);
router.get('/:id/voltage-power', protectRoute, getVoltageAndPower); 

export default router;
