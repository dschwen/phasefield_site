const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const cp = require('child_process');
const rm = require('rimraf');
const which = require('which');
const recursive = require('recursive-readdir');
const Convert = require('ansi-to-html');

// active simulations
var simulations = new Map();

// do we have the vtu2vtp executable in the path?
var vtu2vtp = null;
which('vtu2vtp', (err, path) => {
  if (!err) {
    vtu2vtp = path;
  }
});

// API call
router.all('/api', (req, res, next) => {
  if (req.body.action === 'setup')
  {
    // get unique id for the overlayfs
    let name = crypto.randomBytes(16).toString('hex');

    // make directory and deposit input file
    let dir = '/var/overlay/upper/' + name;
    fs.mkdir(dir, 0o744, err => {
      if (err) 
      {
        res.json({'status': 'error', 'message': 'Unable to create upper overlay directory.'});
        return;
      }

      fs.writeFile(dir + '/input.i', req.body.input, err => { 
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
    let name = req.body.name;
    let file = req.body.file;

    console.log(simulations);

    // check if the simulation exists
    if (!name || !simulations.has(name)) {
      res.status(500);
      //res.render('Unknown simulation name.');
      return;
    }

    let sim = simulations.get(name);

    // check if the file exists
    if (!file || sim.files.indexOf(file) < 0) {
      res.status(404);
      //res.render('Requesting an invalid simulation output file.');
      return;
    }

    // load file data
    let dir = '/var/overlay/upper/' + name;
    fs.readFile(dir + '/' + file, (err, data) => {
      if (err) {
        res.status(500);
        console.log(err);
        //res.render('Error reading file.');
        return;
      } else {
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Length': data.length
        });
        res.end(data);
      }
    });
  }
  else
  {
    res.json({'status': 'error', 'message': 'Unknown or missing action parameter.'});
  }
});

// websockets
router.ws('/api', (ws, req) => {
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

  sim.child.on('exit', (code, signal) => {
    // immediately send exit code
    ws.send(JSON.stringify({'exit': code}));

    // gather file list (if the run was successful)
    if (code === 0) {
      recursive(sim.dir, (err, absolute_paths) => {
        if (!err) {
          // make paths relative to sim.dir
          let relative_paths = [];
          absolute_paths.forEach(path => {
            // only add paths if they are strictly below sim.dir
            if (path.substr(0, sim.dir.length) === sim.dir) {
              let new_path = path.substr(sim.dir.length + 1);
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

  sim.child.stdout.on('data', data => {
    ws.send(JSON.stringify({
      'stdout': convert.toHtml(data.toString())
    }));
  });
  sim.child.stderr.on('data', data => {
    ws.send(JSON.stringify({
      'stderr': convert.toHtml(data.toString())
    }));
  });

  ws.on('close', msg => {
    // kill potentially running process
    sim.child.kill();

    // cleanup upper dir
    rm(sim.dir, () => console.log('Deleted ', sim.dir));
    simulations.delete(name);
  });
});

module.exports = router;
