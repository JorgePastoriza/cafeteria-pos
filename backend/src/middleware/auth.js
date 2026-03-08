// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User, Role, SuperAdmin } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ error: 'Token no proporcionado' });

    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.type === 'superadmin')
      return res.status(403).json({ error: 'Use el endpoint de super admin' });

    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role' }]
    });
    if (!user || !user.active) return res.status(401).json({ error: 'Usuario no autorizado' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: e.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role.name))
    return res.status(403).json({ error: 'Permisos insuficientes' });
  next();
};

const authenticateSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ error: 'Token no proporcionado' });

    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.type !== 'superadmin')
      return res.status(403).json({ error: 'Solo para super administradores' });

    const sa = await SuperAdmin.findByPk(decoded.id);
    if (!sa || !sa.active) return res.status(401).json({ error: 'No autorizado' });
    req.superAdmin = sa;
    next();
  } catch (e) {
    return res.status(401).json({ error: e.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido' });
  }
};

module.exports = { authenticate, authorize, authenticateSuperAdmin };
