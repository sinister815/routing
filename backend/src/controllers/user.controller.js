import '../config/env.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js'; 

const JWT_SECRET = process.env.JWT_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents client-side JS (XSS) from reading the cookie
  secure: IS_PRODUCTION, // Enforces HTTPS in production
  sameSite: 'lax', // CSRF protection setting ('strict' or 'lax')
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });


      const token = jwt.sign(
      { id: newUser._id.toString(), email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);


    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send token as HTTP-Only Cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Logout User & Clear Cookie ---
export const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Get Authenticated Profile ---
export const getProfile = async (req, res) => {
  try {
    // req.user is set by the authenticate middleware
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};