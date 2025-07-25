const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Winky server is up and running!' });
});

module.exports = router;