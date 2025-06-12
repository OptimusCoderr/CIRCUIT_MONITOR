
import { generateToken } from "../../lib/utils.js";
import User from "../../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  const { email, name, password } = req.body;

  try {
    if (!email || !name || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      name,
      password: hashedPassword,
    });

    await newUser.save();

    generateToken(newUser._id, res);

    return res.status(201).json({
      _id: newUser._id,
      email: newUser.email,
      name: newUser.name,
    });
  } catch (error) {
    console.error("Signup auth controller error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const login = async (req, res) => {
  const {email, password} = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }
      //generate token
      generateToken(user._id, res);
      return res.status(200).json({
        _id: user._id,
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      console.log("Error creating user in LOGIN auth controller: ", error.message);
      return res.status(400).json({ message: "Internal server error" });
    }
}

export const logout = (req, res) => {
    try{
      res.cookie("jwt", "", {maxAge: 0});
      return res.status(200).json({ message: "Logged out successfully" });
    }
    catch (error) {
      console.log("Error creating user in LOGOUT CONTROLLER: ", error.message);
      return res.status(400).json({ message: "Internal server error" });
    }
}


export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (rerror) {
    console.log("Error creating user in CHECK AUTH CONTROLLER: ", error.message);
    return res.status(400).json({ message: "Internal server error" }); 
  }
}