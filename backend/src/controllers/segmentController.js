const prisma = require('../config/database');

const createSegment = async (req, res) => {
  try {
    const { name, description, rules } = req.body;
    const { tenantId } = req.user;

    const segment = await prisma.savedSegment.create({
      data: {
        tenantId,
        name,
        description,
        rules
      }
    });

    res.status(201).json(segment);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Segment name already exists' });
    res.status(500).json({ error: 'Failed to save segment' });
  }
};

const getSegments = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const segments = await prisma.savedSegment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(segments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
};

const deleteSegment = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    await prisma.savedSegment.delete({
      where: { id, tenantId }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete segment' });
  }
};

module.exports = { createSegment, getSegments, deleteSegment };
