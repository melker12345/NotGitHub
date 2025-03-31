const express = require('express');
const router = express.Router();

// Mock data for demonstration
const sshKeys = [
  { id: 1, name: 'Work Laptop', fingerprint: 'SHA256:abc123', created_at: new Date() },
  { id: 2, name: 'Personal MacBook', fingerprint: 'SHA256:def456', created_at: new Date() },
];

// GET /api/profile/ssh-keys
router.get('/ssh-keys', (req, res) => {
  res.json(sshKeys);
});

module.exports = router;
