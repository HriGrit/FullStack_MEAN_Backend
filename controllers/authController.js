import { User } from '../models/userModel.js';
import { userSignUpSchema, userSignInSchema } from '../models/zodValidationModels.js';
import { hashPassword, comparePasswords } from '../services/hashServices.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../services/jwtServices.js';

// Helper to get cookie options based on environment
const getCookieOptions = (path = '/') => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    path,
    sameSite: isProd ? 'none' : 'lax',
  };
};

export const userSignup = async (req, res) => {

  const parsedBodyData = userSignUpSchema.safeParse(req.body);
  if (!parsedBodyData.success) {
    return res.status(400).json({ error: parsedBodyData.error.message});
  }

  const { name, password, email, phone } = parsedBodyData.data;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User Already Exists' });
    }

    const hashedPassword = await hashPassword(password);

    // Create user, default role is PATIENT if not provided
    const newUser = await User.create({
      name,
      password: hashedPassword,
      email,
      phone
    });

    if (newUser) {
      const accessToken = await generateAccessToken(newUser._id, newUser.role);
      const refreshToken = await generateRefreshToken(newUser._id, newUser.role);

      const cookieOptions = getCookieOptions('/');
      const refreshCookieOptions = { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 };
      const accessCookieOptions = { ...cookieOptions, maxAge: 15 * 60 * 1000 };

      return res
        .cookie('accessToken', accessToken, accessCookieOptions)
        .cookie('refreshToken', refreshToken, refreshCookieOptions)
        .status(201)
        .json({
          success: true,
          role: newUser.role,
          user: {
            id: newUser._id
          },
          message: 'User registered successfully',
        });
    }
  } catch (e) {
    return res.status(500).json({ message: `Something Went Wrong: ${e.message}` });
  }
};

export const userSignIn = async (req, res) => {
  const parsedUserData = userSignInSchema.safeParse(req.body);
  if (!parsedUserData.success) {
    return res.status(400).json({ error: parsedUserData.error.message });
  }

  try {
    const { email, password } = parsedUserData.data;
    const userExists = await User.findOne({ email });

    if (!userExists) {
      return res.status(411).json({
        success: false,
        message: 'Invalid Email'
      });
    }

    const isPasswordValid = await comparePasswords(password, userExists.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    const accessToken = await generateAccessToken(userExists._id, userExists.role);
    const refreshToken = await generateRefreshToken(userExists._id, userExists.role);

    const cookieOptions = getCookieOptions('/');
    const refreshCookieOptions = { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 };
    const accessCookieOptions = { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 };

    return res
      .cookie('accessToken', accessToken, accessCookieOptions)
      .cookie('refreshToken', refreshToken, refreshCookieOptions)
      .status(200)
      .json({
        success: true,
        role: userExists.role,
        user: {
          id: userExists._id
        },
        message: 'User logged in successfully',
      });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: `Something Bad Happened: ${e.message}`
    });
  }
};

/**
 * Refresh Token Endpoint
 * Uses refresh token to generate new access and refresh tokens
 */
export const refreshTokens = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token missing. Please log in again.'
    });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    // Verify user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new tokens
    const newAccessToken = await generateAccessToken(user._id, user.role);
    const newRefreshToken = await generateRefreshToken(user._id, user.role);

    const cookieOptions = getCookieOptions('/');
    const refreshCookieOptions = { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 };
    const accessCookieOptions = { ...cookieOptions, maxAge: 15 * 60 * 1000 };

    return res
      .cookie('accessToken', newAccessToken, accessCookieOptions)
      .cookie('refreshToken', newRefreshToken, refreshCookieOptions)
      .status(200)
      .json({
        success: true,
        message: 'Tokens refreshed successfully'
      });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token. Please log in again.',
      error: error.message
    });
  }
};

/**
 * Logout Endpoint
 * Clears the access and refresh token cookies
 */
export const userLogout = async (req, res) => {
  try {
    const cookieOptions = getCookieOptions('/');
    return res
      .clearCookie('accessToken', cookieOptions)
      .clearCookie('refreshToken', cookieOptions)
      .status(200)
      .json({
        success: true,
        message: 'User logged out successfully'
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Logout failed: ${error.message}`
    });
  }
};
