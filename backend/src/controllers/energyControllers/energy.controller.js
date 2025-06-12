import EnergyData from '../../models/EnergyData.model.js';

// Create new energy data with batch readings
export const createEnergyData = async (req, res) => {
  try {
    const { circuit, readings, totalEnergyConsumed, status } = req.body;

    // Validate readings array
    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ 
        message: 'Readings array is required and must contain at least one reading' 
      });
    }

    if (readings.length > 20) {
      return res.status(400).json({ 
        message: 'Maximum 20 readings allowed per batch' 
      });
    }

    // Validate each reading has required fields
    for (let i = 0; i < readings.length; i++) {
      const reading = readings[i];
      if (!reading.timestamp || !reading.voltage || !reading.current || 
          !reading.ACvoltage || !reading.ACcurrent || !reading.power) {
        return res.status(400).json({ 
          message: `Reading at index ${i} is missing required fields` 
        });
      }
    }

    const newEnergyData = new EnergyData({
      circuit,
      readings,
      totalEnergyConsumed,
      status: status || 'active'
    });

    const savedData = await newEnergyData.save();
    res.status(201).json(savedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Alternative method for single reading (backward compatibility)
export const createSingleEnergyData = async (req, res) => {
  try {
    const { circuit, voltage, current, ACvoltage, ACcurrent, power, energyConsumed, status } = req.body;

    const reading = {
      timestamp: new Date(),
      voltage,
      current,
      ACvoltage,
      ACcurrent,
      power
    };

    const newEnergyData = new EnergyData({
      circuit,
      readings: [reading],
      totalEnergyConsumed: energyConsumed,
      status: status || 'active'
    });

    const savedData = await newEnergyData.save();
    res.status(201).json(savedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all energy data
export const getAllEnergyData = async (req, res) => {
  try {
    const { 
      limit = 50, 
      page = 1, 
      circuit, 
      startDate, 
      endDate,
      includeReadings = 'true' 
    } = req.query;

    const query = {};
    
    if (circuit) {
      query.circuit = circuit;
    }
    
    if (startDate || endDate) {
      query.batchTimestamp = {};
      if (startDate) query.batchTimestamp.$gte = new Date(startDate);
      if (endDate) query.batchTimestamp.$lte = new Date(endDate);
    }

    let dbQuery = EnergyData.find(query)
      .populate('circuit')
      .sort({ batchTimestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Option to exclude readings array for lighter responses
    if (includeReadings === 'false') {
      dbQuery = dbQuery.select('-readings');
    }

    const data = await dbQuery;
    const total = await EnergyData.countDocuments(query);

    res.status(200).json({
      data,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get energy data by ID
export const getEnergyDataById = async (req, res) => {
  try {
    const data = await EnergyData.findById(req.params.id).populate('circuit');
    if (!data) return res.status(404).json({ message: 'Data not found' });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get flattened readings (all individual readings across batches)
export const getFlattenedReadings = async (req, res) => {
  try {
    const { circuit, startDate, endDate, limit = 1000 } = req.query;
    
    const query = {};
    if (circuit) query.circuit = circuit;
    if (startDate || endDate) {
      query.batchTimestamp = {};
      if (startDate) query.batchTimestamp.$gte = new Date(startDate);
      if (endDate) query.batchTimestamp.$lte = new Date(endDate);
    }

    const energyDataList = await EnergyData.find(query)
      .populate('circuit')
      .sort({ batchTimestamp: -1 })
      .limit(parseInt(limit));

    // Flatten all readings into a single array
    const flattenedReadings = [];
    energyDataList.forEach(batch => {
      batch.readings.forEach(reading => {
        flattenedReadings.push({
          ...reading.toObject(),
          circuit: batch.circuit,
          batchId: batch._id,
          batchTimestamp: batch.batchTimestamp,
          status: batch.status
        });
      });
    });

    // Sort by timestamp
    flattenedReadings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json(flattenedReadings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get real-time calculated statistics (computed on demand)
export const getCalculatedStats = async (req, res) => {
  try {
    const { circuit, startDate, endDate } = req.query;
    
    const query = {};
    if (circuit) query.circuit = circuit;
    if (startDate || endDate) {
      query.batchTimestamp = {};
      if (startDate) query.batchTimestamp.$gte = new Date(startDate);
      if (endDate) query.batchTimestamp.$lte = new Date(endDate);
    }

    // Aggregation pipeline to calculate statistics
    const pipeline = [
      { $match: query },
      { $unwind: '$readings' },
      {
        $group: {
          _id: '$circuit',
          avgVoltage: { $avg: '$readings.voltage' },
          avgCurrent: { $avg: '$readings.current' },
          avgACVoltage: { $avg: '$readings.ACvoltage' },
          avgACCurrent: { $avg: '$readings.ACcurrent' },
          avgPower: { $avg: '$readings.power' },
          maxPower: { $max: '$readings.power' },
          minPower: { $min: '$readings.power' },
          maxVoltage: { $max: '$readings.voltage' },
          minVoltage: { $min: '$readings.voltage' },
          totalReadings: { $sum: 1 },
          firstTimestamp: { $min: '$readings.timestamp' },
          lastTimestamp: { $max: '$readings.timestamp' }
        }
      },
      {
        $lookup: {
          from: 'circuits',
          localField: '_id',
          foreignField: '_id',
          as: 'circuit'
        }
      },
      { $unwind: '$circuit' }
    ];

    const stats = await EnergyData.aggregate(pipeline);
    
    // Calculate duration for each circuit
    const enrichedStats = stats.map(stat => ({
      ...stat,
      durationSeconds: stat.firstTimestamp && stat.lastTimestamp 
        ? (new Date(stat.lastTimestamp) - new Date(stat.firstTimestamp)) / 1000 
        : 0
    }));

    res.status(200).json(enrichedStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get aggregated data for charts (simplified without pre-calculated fields)
export const getAggregatedData = async (req, res) => {
  try {
    const { circuit, groupBy = 'hour', startDate, endDate } = req.query;
    
    const matchQuery = {};
    if (circuit) matchQuery.circuit = circuit;
    if (startDate || endDate) {
      matchQuery.batchTimestamp = {};
      if (startDate) matchQuery.batchTimestamp.$gte = new Date(startDate);
      if (endDate) matchQuery.batchTimestamp.$lte = new Date(endDate);
    }

    // Aggregation pipeline
    const pipeline = [
      { $match: matchQuery },
      { $unwind: '$readings' },
      {
        $group: {
          _id: {
            circuit: '$circuit',
            // Group by different time intervals
            ...(groupBy === 'hour' && {
              year: { $year: '$readings.timestamp' },
              month: { $month: '$readings.timestamp' },
              day: { $dayOfMonth: '$readings.timestamp' },
              hour: { $hour: '$readings.timestamp' }
            }),
            ...(groupBy === 'day' && {
              year: { $year: '$readings.timestamp' },
              month: { $month: '$readings.timestamp' },
              day: { $dayOfMonth: '$readings.timestamp' }
            }),
            ...(groupBy === 'week' && {
              year: { $year: '$readings.timestamp' },
              week: { $week: '$readings.timestamp' }
            })
          },
          avgVoltage: { $avg: '$readings.voltage' },
          avgCurrent: { $avg: '$readings.current' },
          avgACVoltage: { $avg: '$readings.ACvoltage' },
          avgACCurrent: { $avg: '$readings.ACcurrent' },
          avgPower: { $avg: '$readings.power' },
          maxPower: { $max: '$readings.power' },
          minPower: { $min: '$readings.power' },
          totalReadings: { $sum: 1 },
          firstTimestamp: { $min: '$readings.timestamp' },
          lastTimestamp: { $max: '$readings.timestamp' }
        }
      },
      { $sort: { '_id.circuit': 1, firstTimestamp: 1 } }
    ];

    const aggregatedData = await EnergyData.aggregate(pipeline);
    res.status(200).json(aggregatedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};