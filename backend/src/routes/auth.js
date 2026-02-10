const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const emailService = require('../services/emailService');

/**
 * Step 1: Register - sends OTP to email
 * Does NOT create user yet, just validates and sends OTP
 */
const register = async (req, res) => {
  try {
    const { tenantName, email, password } = req.body;

    // Validate input
    if (!tenantName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists (Tenant or User)
    const existingTenant = await prisma.tenant.findUnique({
      where: { email },
    });
    if (existingTenant) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check if there's a pending invitation for this email
    const pendingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      include: { tenant: true },
    });

    // Generate and save OTP
    const code = emailService.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate old OTPs for this email
    await prisma.otpCode.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    await prisma.otpCode.create({
      data: { email, code, expiresAt },
    });

    // Send OTP email
    await emailService.sendOtp(email, code);

    // Hash password and store temporarily in session/response
    // We'll re-validate in verify-otp
    const passwordHash = await bcrypt.hash(password, 10);

    res.status(200).json({
      message: 'Verification code sent to your email',
      needsOtp: true,
      // Pass back encrypted registration data (not the OTP!)
      registrationToken: jwt.sign(
        { tenantName, email, passwordHash, invitation: pendingInvitation ? pendingInvitation.id : null },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      ),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

/**
 * Step 2: Verify OTP and create account
 */
const verifyOtp = async (req, res) => {
  try {
    const { registrationToken, otp } = req.body;

    if (!registrationToken || !otp) {
      return res.status(400).json({ error: 'Registration token and OTP are required' });
    }

    // Decode registration data
    let registrationData;
    try {
      registrationData = jwt.verify(registrationToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'Registration session expired. Please register again.' });
    }

    const { tenantName, email, passwordHash, invitation: invitationId } = registrationData;

    // Verify OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        code: otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    let result;

    // Check if this is an invitation acceptance
    if (invitationId) {
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        include: { tenant: true },
      });

      if (invitation && invitation.status === 'pending' && invitation.expiresAt > new Date()) {
        // Join existing tenant
        result = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              tenantId: invitation.tenantId,
              email,
              passwordHash,
              role: invitation.role,
              emailVerified: true,
            },
          });

          await tx.invitation.update({
            where: { id: invitationId },
            data: { status: 'accepted' },
          });

          return { tenant: invitation.tenant, user };
        });
      } else {
        // Invitation expired or already used, create new tenant
        result = await createNewTenant(tenantName, email, passwordHash);
      }
    } else {
      // Normal registration - create new tenant
      result = await createNewTenant(tenantName, email, passwordHash);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        tenantId: result.tenant.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        subscriptionPlan: result.tenant.subscriptionPlan,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

/**
 * Helper: Create new tenant and admin user
 */
async function createNewTenant(tenantName, email, passwordHash) {
  return await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: tenantName,
        email,
        subscriptionPlan: 'basic',
        status: 'trial',
      },
    });

    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash,
        role: 'admin',
        emailVerified: true,
      },
    });

    return { tenant, user };
  });
}

/**
 * Resend OTP code
 */
const resendOtp = async (req, res) => {
  try {
    const { registrationToken } = req.body;

    if (!registrationToken) {
      return res.status(400).json({ error: 'Registration token is required' });
    }

    let registrationData;
    try {
      registrationData = jwt.verify(registrationToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'Registration session expired. Please register again.' });
    }

    const { email } = registrationData;

    // Generate new OTP
    const code = emailService.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate old OTPs
    await prisma.otpCode.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    await prisma.otpCode.create({
      data: { email, code, expiresAt },
    });

    await emailService.sendOtp(email, code);

    res.json({ message: 'New verification code sent' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend code' });
  }
};

/**
 * Login existing user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by unique email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check tenant status
    if (user.tenant.status !== 'active' && user.tenant.status !== 'trial') {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        subscriptionPlan: user.tenant.subscriptionPlan,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};


// Routes
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);

module.exports = router;
