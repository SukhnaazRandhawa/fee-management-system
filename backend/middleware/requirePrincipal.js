module.exports = function requirePrincipal(req, res, next) {
  if (!req.school || req.school.role !== 'principal') {
    return res.status(403).json({ error: 'Access denied. Principal only.' });
  }
  next();
}; 