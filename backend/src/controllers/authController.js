// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

/**
 * POST /api/auth/login
 * Autenticación de usuario con JWT
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const user = await User.findOne({
      where: { email, active: true },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * GET /api/auth/me
 * Obtener usuario autenticado actual
 */
const me = async (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role.name
  });
};

// DIAGNÓSTICO LOGIN POST TEMPORAL
router.post('/debug-login-post', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { User, Role } = require('../models');
  
  try {
    const { email, password } = req.body;
    
    // Buscar usuario exactamente igual que el authController
    const user = await User.findOne({
      where: { email, active: true },
      include: [{ model: Role, as: 'role' }]
    });
    
    if (!user) return res.json({ paso1: 'FALLO - usuario no encontrado o inactivo' });
    
    // Probar validatePassword del modelo
    const resultModelo = await user.validatePassword(password);
    
    // Probar bcrypt directo
    const resultDirecto = await bcrypt.compare(password, user.password);
    
    res.json({
      paso1: 'OK - usuario encontrado',
      email: user.email,
      activo: user.active,
      hashEnBD: user.password,
      passwordRecibido: password,
      validatePasswordModelo: resultModelo,
      bcryptDirecto: resultDirecto
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

module.exports = { login, me };
