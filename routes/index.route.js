const express = require('express');
const router = express.Router();

// Example API route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Winky server is running!' });
});

module.exports = router;
