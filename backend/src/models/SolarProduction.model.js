// models/SolarProduction.model.js
import mongoose from 'mongoose';

const solarSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now
    },
    solarPowerOutput: {
      type: Number,
      required: true,
      unit: 'Watts'
    },
    energyGenerated: {
      type: Number,
      required: true,
      unit: 'kWh'
    },
    irradiance: {
      type: Number,
      unit: 'W/m²'
    },
    temperature: {
      type: Number,
      unit: '°C'
    }
  },
  { timestamps: true }
);

export default mongoose.model('SolarProduction', solarSchema);