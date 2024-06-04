const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

router.post('/add-team', teamController.addTeam);
router.post('/process-result', teamController.processResult);
router.get('/team-result', teamController.teamResult);

module.exports = router;
