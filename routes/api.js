var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var fs = require('fs');

// API call
router.all('/api', function(req, res, next) {
  if (req.body.action === 'setup')
  {
    // get unique id for the overlayfs
    var name = crypto.randomBytes(16).toString('hex');

    // make directory and deposit input file
    var dir = '/var/overlay/upper/' + name;
    fs.mkdir(dir, 0o744, function(err) {
      if (err) 
      {
        res.json({'status': 'error', 'message': 'Unable to create upper overlay directory.'});
      }

      fs.writeFile(dir + '/input.i', req.body.input, function(err) { 
        if (err)
        {
          res.json({'status': 'error', 'message': 'Unable to write input file.'});
        }
        
        // success
        res.json({'status': 'success', 'name': name});
      });
    });
  }
  else
  {
    res.json({'status': 'error', 'message': 'Unknown or missing action parameter.'});
  }
});

// websockets
router.ws('/echo', function(ws, req) {
  console.log('received connection');
  ws.on('message', function(msg) {
    ws.send(msg);
  });
});

module.exports = router;
