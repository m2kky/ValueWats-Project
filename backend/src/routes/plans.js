const express = require('express');
const prisma = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' }
    });

    res.json(plans);
  } catch (error) {
    console.error('Failed to fetch public plans', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

module.exports = router;
