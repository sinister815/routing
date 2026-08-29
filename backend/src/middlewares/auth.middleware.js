import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  // Extract token from HTTP-only cookie
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No authentication token provided.' 
    });
  }

  try {
    // Verify token validity
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired authentication token.' 
    });
  }
};