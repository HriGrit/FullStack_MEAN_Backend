/**
 * Implementing a Stateless Approach
 * 
 * Fetching Access Token from request via Cookies
 * Using httpOnly Cookies to make it inaccessible to JavaScript
 */
import { User } from '../models/userModel.js';
import { verifyAccessToken } from '../services/jwtServices.js';

export async function authenticateJWT(req, res, next) {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: 'Access token missing. Please log in.'
    });
  }

  try {
    const verifiedAccessToken = verifyAccessToken(accessToken);
    
    const userId = verifiedAccessToken.id;
    const userRole = verifiedAccessToken.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Token'
      });
    }

    // Fetch user from database to ensure they still exist
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user information to request object
    req.userId = userId;
    req.role = userRole;
    req.user = user;

    next();
  } catch (error) {
    // Handle token expiration
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired. Please refresh your token.',
        error: 'TokenExpiredError'
      });
    }

    // Handle other JWT errors
    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed token',
      error: error.message
    });
  }
}
