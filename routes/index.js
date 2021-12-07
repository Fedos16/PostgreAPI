const Router = require('express');
const router = new Router();

const apiController = require('../controllers');

router.post('/signup', apiController.signup);
router.post('/signin', apiController.signin);
router.post('/events', apiController.events);

module.exports = router;