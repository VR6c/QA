import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';
import { recordActivity } from '../services/auditLogger.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

// Helper to create JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id || user._id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Default Demo Accounts
export const DEMO_USERS = [
  {
    name: 'Vireak',
    username: 'vireak',
    email: 'vireak@pecc.com',
    password: 'password123',
    role: 'Super Admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vireak'
  },
  {
    name: 'QA Tester',
    username: 'tester',
    email: 'tester@pecc.com',
    password: 'password123',
    role: 'QA Tester',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tester'
  },
  {
    name: 'Dev Team',
    username: 'devteam',
    email: 'dev@pecc.com',
    password: 'password123',
    role: 'Developer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Developer'
  }
];

// Seed initial users if database is empty or sync role
export const seedDemoUsers = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('🔒 Production environment detected: Demo user seeding is disabled.');
    return;
  }

  try {
    for (const demo of DEMO_USERS) {
      const existing = await User.findOne({ $or: [{ email: demo.email }, { username: demo.username }] });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(demo.password, 10);
        await User.create({
          ...demo,
          password: hashedPassword
        });
      } else {
        let updated = false;
        if (existing.role !== demo.role) {
          existing.role = demo.role;
          updated = true;
        }
        if (!existing.username) {
          existing.username = demo.username;
          updated = true;
        }
        if (updated) {
          await existing.save();
        }
      }
    }
    console.log('🌱 Demo user accounts initialized & verified.');
  } catch (error) {
    console.error('Error seeding demo users:', error.message);
  }
};

// Register User
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required.', 400, 'ERR_VALIDATION');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return sendError(res, 'An account with this email address already exists.', 409, 'ERR_CONFLICT');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'QA Tester',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`
    });

    recordActivity({
      req,
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      roleName: user.role,
      module: 'Authentication',
      action: 'USER_REGISTER',
      targetType: 'User',
      targetId: user._id.toString(),
      targetName: user.name,
      description: `Registered new account ${user.name} (${user.email}) as ${user.role}`
    });

    const token = generateToken(user);
    return sendSuccess(res, {
      token,
      user: user.toJSON()
    }, null, 'Account created successfully!', 201);
  } catch (error) {
    return sendError(res, error.message || 'Server error during registration', 500, 'ERR_INTERNAL');
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required.', 400, 'ERR_VALIDATION');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      recordActivity({
        req,
        userId: 'Guest',
        userName: 'Guest',
        userEmail: normalizedEmail,
        roleName: 'Guest',
        module: 'Authentication',
        action: 'LOGIN_FAILED',
        description: `Failed login attempt for non-existing email: ${normalizedEmail}`,
        status: 'Failed'
      });
      return sendError(res, 'Invalid credentials. User not found.', 401, 'ERR_UNAUTHORIZED');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      recordActivity({
        req,
        userId: user._id.toString(),
        userName: user.name,
        userEmail: user.email,
        roleName: user.role,
        module: 'Authentication',
        action: 'LOGIN_FAILED',
        description: `Failed login attempt (incorrect password) for ${user.email}`,
        status: 'Failed'
      });
      return sendError(res, 'Invalid credentials. Incorrect password.', 401, 'ERR_UNAUTHORIZED');
    }

    recordActivity({
      req,
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      roleName: user.role,
      module: 'Authentication',
      action: 'USER_LOGIN',
      description: `User ${user.name} logged in successfully`
    });

    const token = generateToken(user);
    return sendSuccess(res, {
      token,
      user: user.toJSON()
    }, null, 'Logged in successfully!');
  } catch (error) {
    return sendError(res, error.message || 'Server error during login', 500, 'ERR_INTERNAL');
  }
};

// Get Current Logged-in User
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found.', 404, 'ERR_NOT_FOUND');
    }
    return sendSuccess(res, { user: user.toJSON() });
  } catch (error) {
    return sendError(res, error.message || 'Server error getting user profile', 500, 'ERR_INTERNAL');
  }
};

// Explicit Seed Endpoint
export const triggerSeed = async (req, res) => {
  try {
    await seedDemoUsers();
    const users = await User.find().select('-password').lean();
    return sendSuccess(res, users, null, 'Seed complete');
  } catch (error) {
    return sendError(res, error.message, 500, 'ERR_INTERNAL');
  }
};
