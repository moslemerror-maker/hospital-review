const jwt = require('jsonwebtoken');

// This function runs before any protected route
// It checks that the request has a valid admin token
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if a token was sent
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. Please log in.' });
  }

  // Extract the token from the header
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // attach admin info to the request
    next();              // continue to the actual route
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
};

module.exports = { protect };