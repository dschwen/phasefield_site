var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var fs = require('fs');
var cp = require('child_process');

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
        simulations.set(name, {
          'prepared': Date.now(), 
          'ip': req.connection.remoteAddress,
          'running': false
        });
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
  if (!name || !simulations.has(name) || simulations.get(name).running)
  {
    ws.close();
    return;
  }

  var sim = simulations.get(name);
  sim.running = true;

  ws.send('welcome ' + JSON.stringify(sim) + '\n');
  
  try {
    sim.child = cp.spawn('/usr/bin/sudo', ['/var/www/phasefield_site/scripts/run_moose.sh', name]);
    //sim.child = cp.spawn('/bin/ls', ['-la', '/']);
  } catch(err) {
    ws.send(JSON.stringify(err));
  }

  sim.child.on('exit', function (code, signal) {
    console.log(ws);
    ws.send('child process exited with ' +
            `code ${code} and signal ${signal}` + '\n');
    //ws.close();
  });

  sim.child.stdout.on('data', function(data) {
    ws.send(data.toString());
  });
  sim.child.stderr.on('data', function(data) {
    ws.send(data.toString());
  });

  ws.on('close', function(msg) {
    sim.child.kill();
  });

/*
  ws.on('message', function(msg) {
    ws.send(msg);
  });
*/
});

module.exports = router;
