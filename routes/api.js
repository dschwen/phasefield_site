var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var fs = require('fs');
var cp = require('child_process');
var rm = require('rimraf');
var recursive = require('recursive-readdir');
var Convert = require('ansi-to-html');

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
        return;
      }

      fs.writeFile(dir + '/input.i', req.body.input, function(err) { 
        if (err)
        {
          res.json({'status': 'error', 'message': 'Unable to write input file.'});
          return;
        }
        
        // success
        simulations.set(name, {
          'prepared': Date.now(), 
          'ip': req.connection.remoteAddress,
          'dir': dir,
          'files': [],
          'running': false
        });
        res.json({'status': 'success', 'name': name});
      });
    });
  }
  else if (req.body.action === 'get')
  {
    var name = req.body.name;
    var file = req.body.file;

    // check if the simulation exists
    if (!name || !simulations.has(name)) {
      res.json({'status': 'error', 'message': 'Unknown simulation name.'});
      return;
    }

    var sim = simulations.get(name);

    // check if the file exists
    if (!file || sim.files.indexOf(file) < 0) {
      res.json({'status': 'error', 'message': 'Requesting an invalid simulation output file.'});
      return;
    }

    // load file data
    var dir = '/var/overlay/upper/' + name;
    fs.readFile(dir + '/' + file, function(err, data) {
      if (err) {
        res.json({'status': 'error', 'message': 'Error reading file.'});
        return;
      } else {
        res.json({'status': 'success', 'data': data});
      }
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

  //ws.send('welcome ' + JSON.stringify(sim) + '\n');
  
  try {
    sim.child = cp.spawn('/usr/bin/sudo', ['/var/www/phasefield_site/scripts/run_moose.sh', name]);
  } catch(err) {
    ws.send(JSON.stringify(err));
    return;
  }

  var convert = new Convert({
    fg: '#333',
    bg: '#f5f5f5',
    stream: true
  });

  sim.child.on('exit', function (code, signal) {
    // immediately send exit code
    ws.send(JSON.stringify({'exit': code}));

    // gather file list (if the run was successful)
    if (code === 0) {
      recursive(sim.dir, function(err, absolute_paths) {
        if (!err) {
          // make paths relative to sim.dir
          var relative_paths = [];
          absolute_paths.forEach(function(path) {
            // only add paths if they are strictly below sim.dir
            if (path.substr(0, sim.dir.length) === sim.dir) {
              var new_path = path.substr(sim.dir.length + 1);
              if (new_path != 'input.i') {
                relative_paths.push(new_path);
              }
           }
          });

         // store file list for validation
         sim.files = relative_paths;

         // send file list to client
          ws.send(JSON.stringify({
            'filelist': relative_paths
          }));
        } else {
          console.log(err);
        }
      });
    }
  });

  sim.child.stdout.on('data', function(data) {
    ws.send(JSON.stringify({
      'stdout': convert.toHtml(data.toString())
    }));
  });
  sim.child.stderr.on('data', function(data) {
    ws.send(JSON.stringify({
      'stderr': convert.toHtml(data.toString())
    }));
  });

  ws.on('close', function(msg) {
    // kill potentially running process
    sim.child.kill();

    // cleanup upper dir
    rm(sim.dir, function() {console.log('Deleted ', sim.dir)});
    simulations.delete(name);
  });
});

module.exports = router;
