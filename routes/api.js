var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var fs = require('fs');

// active simulations
var simulations = new Map();

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
        simulations.set(name, {'prepared': Date.now(), 'ip': req.connection.remoteAddress});
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
router.ws('/api', function(ws, req) {
  var name = req.query.name;
  if (!name || !simulations.has(name))
  {
    ws.close();
    return;
  }

  ws.send('welcome ' + JSON.stringify(simulations.get(name)));
  
  ws.on('message', function(msg) {
    ws.send(msg);
  });
});

module.exports = router;