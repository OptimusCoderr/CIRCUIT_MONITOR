
// models/Circuit.model.js
import mongoose from 'mongoose';

const circuitSchema = new mongoose.Schema(
  {
    user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['on', 'off'],
      default: 'off'
    },
    voltage: {
      type: Number,
      default: 230 // volts
    },
    powerRating: {
      type: Number,
      default: 1000 // watts
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Circuit', circuitSchema);