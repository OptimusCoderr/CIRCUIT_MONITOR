// controllers/circuit.controller.js
import Circuit from "../../models/Circuit.model.js";

// 1. Create Circuit
export const createCircuit = async (req, res) => {
  try {
    const { name, description, voltage, powerRating } = req.body;
    const userId = req.user._id;

    const newCircuit = await Circuit.create({
      user: userId,
      name,
      description,
      voltage,
      powerRating,
      lastUpdatedBy: userId,
    });

    res.status(201).json({ success: true, data: newCircuit });
  } catch (error) {
    console.error("Error creating circuit:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 2. Toggle Circuit On/Off
export const toggleCircuit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const circuit = await Circuit.findOne({ _id: id, user: userId });
    if (!circuit) {
      return res.status(404).json({ success: false, message: "Circuit not found" });
    }

    circuit.status = circuit.status === "on" ? "off" : "on";
    circuit.lastUpdatedBy = userId;
    await circuit.save();

    res.status(200).json({ success: true, data: circuit });
  } catch (error) {
    console.error("Error toggling circuit:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 3. Update Voltage and Power (e.g., from IoT device or HTTP request)
export const updateVoltageAndPower = async (req, res) => {
  try {
    const { id } = req.params;
    const { voltage, powerRating } = req.body;
    const userId = req.user._id;

    const circuit = await Circuit.findOne({ _id: id, user: userId });
    if (!circuit) {
      return res.status(404).json({ success: false, message: "Circuit not found" });
    }

    if (voltage !== undefined) circuit.voltage = voltage;
    if (powerRating !== undefined) circuit.powerRating = powerRating;
    circuit.lastUpdatedBy = userId;

    await circuit.save();

    res.status(200).json({ success: true, data: circuit });
  } catch (error) {
    console.error("Error updating voltage/power:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 4. Get All Circuits for Logged-in User
export const getAllCircuits = async (req, res) => {
  try {
    const userId = req.user._id;
    const circuits = await Circuit.find({ user: userId }).select("-__v");

    res.status(200).json({ success: true, count: circuits.length, data: circuits });
  } catch (error) {
    console.error("Error fetching circuits:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 5. Get Single Circuit
export const getSingleCircuit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const circuit = await Circuit.findOne({ _id: id, user: userId }).select("-__v");
    if (!circuit) {
      return res.status(404).json({ success: false, message: "Circuit not found" });
    }

    res.status(200).json({ success: true, data: circuit });
  } catch (error) {
    console.error("Error fetching circuit:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔥 NEW: Get Only Voltage and Power
export const getVoltageAndPower = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const circuit = await Circuit.findOne({ _id: id, user: userId }).select("voltage powerRating -_id");
    if (!circuit) {
      return res.status(404).json({ success: false, message: "Circuit not found" });
    }

    res.status(200).json({ success: true, data: circuit });
  } catch (error) {
    console.error("Error fetching voltage and power:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 6. Edit Circuit
export const editCircuit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user._id;

    const circuit = await Circuit.findOne({ _id: id, user: userId });
    if (!circuit) {
      return res.status(404).json({ success: false, message: "Circuit not found" });
    }

    if (name) circuit.name = name;
    if (description) circuit.description = description;
    circuit.lastUpdatedBy = userId;

    await circuit.save();

    res.status(200).json({ success: true, data: circuit });
  } catch (error) {
    console.error("Error editing circuit:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 7. Delete Circuit
export const deleteCircuit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const result = await Circuit.deleteOne({ _id: id, user: userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Circuit not found" });
    }

    res.status(200).json({ success: true, message: "Circuit deleted successfully" });
  } catch (error) {
    console.error("Error deleting circuit:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};