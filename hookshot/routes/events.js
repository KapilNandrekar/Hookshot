const express = require('express');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');
const { getActiveEndpoints } = require('../utils/endpointHelpers');
const { createLimiter } = require('../rateLimiter');

const eventLimiter = createLimiter({ limit: 20, windowMs: 60 * 1000 });
const eventRateLimit = eventLimiter.middleware((req) => req.user.id);

const router = express.Router();

router.post('/', authMiddleware, eventRateLimit, async (req, res) => {
  try {
    const { type, data } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!type) {
      return res.status(400).json({ error: 'Event type is required.' });
    }

    if (!idempotencyKey) {
      return res.status(400).json({ error: 'Idempotency-Key header is required.' });
    }

    const activeEndpoints = await getActiveEndpoints(req.user.id);
    const endpointIds = activeEndpoints.map((ep) => ep._id);

    try {
      const event = await Event.create({
        userId: req.user.id,
        type,
        data: data || {},
        idempotencyKey,
        endpointIds,
      });

      return res.status(201).json(event);
    } catch (err) {
      if (err.code === 11000) {
        const existingEvent = await Event.findOne({
          userId: req.user.id,
          idempotencyKey,
        });
        return res.status(200).json(existingEvent);
      }
      throw err;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating event.' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching events.' });
  }
});

module.exports = router;