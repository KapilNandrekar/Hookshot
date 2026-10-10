const jwt = require('jsonwebtoken');


module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) {//Just checks whether the header is undefined or not
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];//Splits the Bearer part
  if (!token) {//if token is undefined or not or null
    return res.status(401).json({ error: 'Access denied. Invalid token format.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);//checks the user and also whether the token is expired or not

    req.user = decoded;//stores the info of that user 
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};