var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/api', function(req, res, next) {
  res.json(req.body);
});

module.exports = router;
