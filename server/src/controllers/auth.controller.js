const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/db');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';
const JWT_EXPIRES_IN = '7d';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// ── Validation Schemas ──────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  departmentId: z.number().int().positive().optional().nullable()
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required')
});

// ── Helper ──────────────────────────────────────────────────────────────────
const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRES_IN }
);

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  username: user.username,
  role: user.role,
  skillLevel: user.skillLevel,
  departmentId: user.departmentId,
  createdAt: user.createdAt
});

// ── POST /api/auth/register ─────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { name, email, username, password, skillLevel, departmentId } = parsed.data;

    // Check duplicates
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existing) {
      const field = existing.email === email ? 'email' : 'username';
      return res.status(409).json({
        success: false,
        errors: { [field]: [`This ${field} is already registered`] }
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        passwordHash,
        role: 'EMPLOYEE', // Always default — never client-controlled
        skillLevel: skillLevel || 'BEGINNER',
        departmentId: departmentId || null
      }
    });

    const token = signToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: safeUser(user)
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// ── POST /api/auth/login ────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { identifier, password } = parsed.data;

    // Look up by email OR username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = signToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// ── POST /api/auth/logout ───────────────────────────────────────────────────
const logout = (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ── GET /api/auth/me ────────────────────────────────────────────────────────
const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, user: safeUser(user) });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, logout, me };
