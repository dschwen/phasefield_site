const express = require('express');
const router  = express.Router();
const moose   = require('../markdown-it-moose.js');
const md      = require('markdown-it')({
                  html: true,
                  linkify: true,
                  typography: true
                }).use(moose);
const fs      = require('fs');

/* GET rendered markdown page. */
router.get('/*.md', function(req, res, next) {
  fs.readFile('pages' + req.path, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.render('pages', { 
        markdown: md.render(data.toString()) 
      });
    }
  });
});

module.exports = router;
