import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

const generateToken = (res: Response, userId: string): string => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // Set cookie for web clients
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProduction, // Only send cookie over HTTPS in production
    sameSite: isProduction ? 'strict' : 'lax', // Stricter in production
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Return token for mobile clients
  return token;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      const token = generateToken(res, (user._id as unknown) as string);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        budget: user.budget,
        token, // Include token for mobile clients
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(res, (user._id as unknown) as string);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        budget: user.budget,
        token, // Include token for mobile clients
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req: Request, res: Response) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  return res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    budget: req.user.budget,
  });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.budget !== undefined) {
      user.budget = req.body.budget;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      budget: updatedUser.budget,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Delete user profile
// @route   DELETE /api/auth/profile
// @access  Private
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);

    if (user) {
      await user.deleteOne();
      res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
      });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
