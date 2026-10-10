const express = require('express');
const Endpoint = require('../models/Endpoint');
const authMiddleware = require('../middleware/authMiddleware');
const cache = require('../cache');
const mongoose = require('mongoose');

const router = express.Router();

function isValidUrl(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body;

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'URL must start with http:// or https://' });
    }

    const endpoint = await Endpoint.create({
      userId: req.user.id,
      url,
    });
    cache.del(`endpoints:${req.user.id}`);

    res.status(201).json(endpoint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating endpoint.' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const endpoints = await Endpoint.find({ userId: req.user.id });
    res.json(endpoints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching endpoints.' });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid endpoint ID format.' });
    }
    const { url, active } = req.body;

    const endpoint = await Endpoint.findOne({ _id: req.params.id, userId: req.user.id });

    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint not found.' });
    }

    if (url !== undefined) {
      if (!isValidUrl(url)) {
        return res.status(400).json({ error: 'URL must start with http:// or https://' });
      }
      endpoint.url = url;
    }

    if (active !== undefined) {
      endpoint.active = active;
    }

    await endpoint.save();
    cache.del(`endpoints:${req.user.id}`);
    res.json(endpoint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating endpoint.' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid endpoint ID format.' });
    }
    const endpoint = await Endpoint.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint not found.' });
    }
    cache.del(`endpoints:${req.user.id}`);

    res.json({ message: 'Endpoint deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting endpoint.' });
  }
});

module.exports = router;