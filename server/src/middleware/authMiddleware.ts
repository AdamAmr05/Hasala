import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  token = req.cookies.jwt;

  console.log('Auth check - cookies:', req.cookies);
  console.log('Auth check - token:', token ? 'present' : 'missing');

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as JwtPayload;

      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(401).json({ message: 'Not authorized, user not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
