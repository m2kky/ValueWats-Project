const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const emailService = require('../services/emailService');
const tenantContext = require('../middleware/tenantContext');

// Protect all routes
router.use(tenantContext);

/**
 * GET /api/team - List team members
 */
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { tenantId: req.tenantId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const invitations = await prisma.invitation.findMany({
      where: { 
        tenantId: req.tenantId,
        status: 'pending',
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users, invitations });
  } catch (error) {
    console.error('List team error:', error);
    res.status(500).json({ error: 'Failed to list team members' });
  }
});

/**
 * POST /api/team/invite - Invite a new member
 */
router.post('/invite', async (req, res) => {
  try {
    const { email, role = 'agent' } = req.body;
    const inviterEmail = req.user.email;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can invite members' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already registered' });
    }

    // Check for pending invitation
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        tenantId: req.tenantId,
        email,
        status: 'pending',
        expiresAt: { gt: new Date() }
      },
    });

    if (existingInvite) {
      return res.status(409).json({ error: 'Invitation already sent' });
    }

    // Create invitation
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invitation = await prisma.invitation.create({
      data: {
        tenantId: req.tenantId,
        email,
        role,
        invitedBy: inviterEmail,
        expiresAt,
      },
      include: { tenant: true }
    });

    // Send email
    await emailService.sendInvitation(email, invitation.tenant.name, inviterEmail, role);

    res.status(201).json({ message: 'Invitation sent', invitation });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

/**
 * DELETE /api/team/:userId - Remove a member
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    // Verify user belongs to tenant
    const userToRemove = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: req.tenantId,
      },
    });

    if (!userToRemove) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

/**
 * DELETE /api/team/invitation/:inviteId - Cancel invitation
 */
router.delete('/invitation/:inviteId', async (req, res) => {
  try {
    const { inviteId } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can cancel invitations' });
    }

    await prisma.invitation.deleteMany({
      where: {
        id: inviteId,
        tenantId: req.tenantId,
      },
    });

    res.json({ message: 'Invitation cancelled' });
  } catch (error) {
    console.error('Cancel invite error:', error);
    res.status(500).json({ error: 'Failed to cancel invitation' });
  }
});

module.exports = router;
