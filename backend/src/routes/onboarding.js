const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const tenantContext = require('../middleware/tenantContext');

/**
 * POST /api/onboarding
 * Saves all 3 steps of the onboarding wizard at once
 */
router.post('/', tenantContext, async (req, res) => {
    try {
        const {
            // Step 1 — Business info
            organizationName,
            website,
            industry,
            orgSize,
            // Step 2 — Organization knowledge
            customerType,
            chatPurposes,
            // Step 3 — Profile
            role,
            phone,
            name,
            referralSource,
            workspaceName,
        } = req.body;

        // Validate required fields
        if (!organizationName || !industry || !orgSize || !customerType || !chatPurposes?.length || !role || !workspaceName?.trim()) {
            return res.status(400).json({ error: 'Please complete all required fields' });
        }

        // Update tenant with onboarding data
        const tenant = await prisma.tenant.update({
            where: { id: req.user.tenantId },
            data: {
                // Workspace name becomes the canonical tenant/workspace name across the app.
                name: workspaceName.trim(),
                website: website || null,
                industry,
                orgSize,
                customerType,
                chatPurposes: chatPurposes || [],
                referralSource: referralSource || null,
                onboardingCompleted: true,
            },
        });

        // Update user profile
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                name: name || null,
                phone: phone || null,
                orgRole: role,
            },
        });

        res.json({
            message: 'Onboarding completed successfully',
            tenant: {
                id: tenant.id,
                name: tenant.name,
                onboardingCompleted: tenant.onboardingCompleted,
            },
        });
    } catch (error) {
        console.error('Onboarding error:', error);
        res.status(500).json({ error: 'Failed to save onboarding data' });
    }
});

module.exports = router;
