import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { add, find } from './utils/db.js';
import { analyzeCarbon } from './utils/gemini.js';

const router = express.Router();

// ============================================
// 1. POST /api/calculate-offset
// ============================================
router.post('/calculate-offset', async (req, res) => {
  try {
    const { industryName, carbonEmissionTons, region, industryType } = req.body;

    // Validate input
    if (!industryName || !carbonEmissionTons || !region || !industryType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Get AI analysis
    const analysis = await analyzeCarbon(req.body);

    // Prepare result
    const result = {
      id: Date.now().toString(),
      industryName,
      carbonEmissionTons,
      region,
      industryType,
      treesRequired: analysis.treesRequired,
      reasoning: analysis.reasoning,
      recommendedSpecies: analysis.species,
      additionalStrategies: analysis.strategies,
      createdAt: new Date().toISOString(),
      userId: req.userId || null // From auth middleware if present
    };

    // Save to database
    await add('calculations.json', result);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Calculation failed'
    });
  }
});

// ============================================
// 2. GET /api/history
// ============================================
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const calculations = await find('calculations.json', 
      calc => calc.userId === req.userId
    );

    res.json({
      success: true,
      data: calculations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history'
    });
  }
});

// ============================================
// 3. POST /api/auth/register
// ============================================
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const users = await find('users.json', u => u.email === email);
    if (users.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: Date.now().toString(),
      email,
      passwordHash,
      name,
      createdAt: new Date().toISOString()
    };

    await add('users.json', user);

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        token
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// ============================================
// 4. POST /api/auth/login
// ============================================
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const users = await find('users.json', u => u.email === email);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        token
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// ============================================
// Auth Middleware
// ============================================
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

export default router;