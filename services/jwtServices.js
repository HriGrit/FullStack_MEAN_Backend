/**
 * Generating Access and Refresh JWT Tokens
 *
 * Access Token is for validating a User request and valid for 15 minutes
 * Refresh Token is to regenerate the Access Token - Refresh Token Pair and valid for 7 Days
 *
 * To be stored in HTTP Only Cookies
 */
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

export const generateAccessToken = async (id, role = 'PATIENT') => {
  return jwt.sign({ id, role }, ACCESS_TOKEN_SECRET, {
    expiresIn: '2h',
  });
};

export const generateRefreshToken = async (id, role = 'PATIENT') => {
  return jwt.sign({ id, role }, REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw error;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw error;
  }
};

