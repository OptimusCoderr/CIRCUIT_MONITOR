// models/EnergyData.model.js
import mongoose from 'mongoose';

// Sub-schema for individual readings
const readingSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true
  },
  voltage: {
    type: Number,
    required: true
  },
  current: {
    type: Number,
    required: true
  },
  ACvoltage: {
    type: Number,
    required: true
  },
  ACcurrent: {
    type: Number,
    required: true
  },
  power: {
    type: Number,
    required: true
  }
}, { _id: false }); // Disable _id for sub-documents

const energyDataSchema = new mongoose.Schema(
  {
    circuit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Circuit',
      required: true
    },
    batchTimestamp: {
      type: Date,
      default: Date.now,
      index: true // Index for faster queries
    },
    // Array of readings (up to 20 or configurable limit)
    readings: {
      type: [readingSchema],
      validate: {
        validator: function(readings) {
          return readings.length <= 20 && readings.length > 0;
        },
        message: 'Readings array must contain between 1 and 20 readings'
      }
    },
    totalEnergyConsumed: {
      type: Number,
      required: true,
      unit: 'kWh'
    },
    status: {
      type: String,
      enum: ['active', 'standby', 'off'],
      default: 'active'
    }
  },
  { 
    timestamps: true,
    // Add compound index for efficient querying
    indexes: [
      { circuit: 1, batchTimestamp: -1 },
      { batchTimestamp: -1 }
    ]
  }
);

// Pre-save middleware to sort readings by timestamp
energyDataSchema.pre('save', function(next) {
  if (this.readings && this.readings.length > 0) {
    // Sort readings by timestamp
    this.readings.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
  next();
});

// Instance method to get latest reading
energyDataSchema.methods.getLatestReading = function() {
  if (!this.readings || this.readings.length === 0) return null;
  return this.readings[this.readings.length - 1];
};

// Instance method to get reading at specific index
energyDataSchema.methods.getReadingAtIndex = function(index) {
  if (!this.readings || index >= this.readings.length || index < 0) return null;
  return this.readings[index];
};

// Static method to get readings for a circuit within date range
energyDataSchema.statics.getReadingsInRange = function(circuitId, startDate, endDate) {
  return this.find({
    circuit: circuitId,
    batchTimestamp: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ batchTimestamp: -1 });
};

// Virtual for backward compatibility - returns latest reading values
energyDataSchema.virtual('voltage').get(function() {
  const latest = this.getLatestReading();
  return latest ? latest.voltage : null;
});

energyDataSchema.virtual('current').get(function() {
  const latest = this.getLatestReading();
  return latest ? latest.current : null;
});

energyDataSchema.virtual('ACvoltage').get(function() {
  const latest = this.getLatestReading();
  return latest ? latest.ACvoltage : null;
});

energyDataSchema.virtual('ACcurrent').get(function() {
  const latest = this.getLatestReading();
  return latest ? latest.ACcurrent : null;
});

energyDataSchema.virtual('power').get(function() {
  const latest = this.getLatestReading();
  return latest ? latest.power : null;
});

// Virtual for timestamp (for backward compatibility)
energyDataSchema.virtual('timestamp').get(function() {
  const latest = this.getLatestReading();
  return latest ? latest.timestamp : this.batchTimestamp;
});

// Ensure virtuals are included in JSON output
energyDataSchema.set('toJSON', { virtuals: true });
energyDataSchema.set('toObject', { virtuals: true });

export default mongoose.model('EnergyData', energyDataSchema);