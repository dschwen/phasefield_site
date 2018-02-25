/***
 *
 * phasefield.net JS functions
 * (c) 2018 Daniel Schwen
 *
 */

// turn on intercative editors
function activateEditors()
{
  $('.moosewrapper').each(function() {
    // get wrapper and editor
    var wrapper = $(this);
    var input   = wrapper.find('.mooseinput');
    var output  = wrapper.find('.mooseoutput');
    var editor  = ace.edit(input[0]);
    var socket  = null;

    // set editor options
    editor.setTheme("ace/theme/github");
    editor.session.setMode("ace/mode/moose");
    editor.setOption("maxLines", 30);
    editor.setOption("minLines", 2);

    // equal height
    setTimeout(() => { output.height(input.height()) }, 1);

    // add controls
    var run_button = wrapper.find('button.mooserun').on('click', function() {
      // disable button to avoid double setup and run
      run_button.attr("disabled", "disabled");

      $.post('/api', { action: 'setup', input: editor.getValue() }, function(data) {
        // run setup failed
        if (data.status === 'error') {
          alert(data.message);
          return;
        }

        // setup succeeded
        if (data.status === 'success') {
          // clear output area
          output.empty();

          // open socket
          socket = new WebSocket('ws://' + location.host + '/api/?name=' + data.name);

          // display output
          socket.onmessage = function (event) {
            var msg;
            try {
              msg = JSON.parse(event.data);
            } catch (err) {
              output.append('parse error');
              return;
            }

            // process exited
            if ('exit' in msg)
            {
              // re-enable button
              run_button.removeAttr("disabled");

              if (msg.exit == 0) {
                // successfully
                output.scrollTop(output[0].scrollHeight);
              } else {
                // an error occured
                // output.css({ 'border-color': 'red'});
              }
            }

            // output file list received
            if ('filelist' in msg) {
              // do not add comntrols if no files were generated
              if (msg.filelist.length === 0) {
                return;
              }

              // build dropdown with file list
              console.log(msg.filelist);
              var dropdown = $('<select />');
              msg.filelist.forEach(el => {
                $('<option />', {value: el, text: el}).appendTo(dropdown);
              });

              // add file load controls
              output_toolbar.empty();
              output_toolbar.append(dropdown).append($('<button>View</button>').on('click', () => {
                let file = dropdown.val();
                if (file.substr(-4) == '.csv') {
                  $.post('/api', { action: 'get', name: data.name, file: file }, (data) => {
                    setupPlot(output, data);
                  });
                } else {
                  output.load('/api', { action: 'get', name: data.name, file: file });
                }
              }));
            }

            // stdout and stderr
            var html = msg.stdout || msg.stderr;
            if (html) {
              output.append(html);
            }
          };
        }
      });
    });
  });
}

// setup a plot wir data on an HTML document
function setupPlot(object, data)
{
  // reformat data for flot
  function preparePoints(col1, col2)
  {
    var points = [];
    var n = data[col1].length;
    if (n != data[col2].length) {
      throw "Column length error";
    }

    for (var i = 0; i < n; ++i) {
      points.push([data[col1][i], data[col2][i]]);
    }

    return points;
  }

  // get all column keys from the JSON
  var keys = [];
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      keys.push(key);
    }
  }

  // add canvas
  //var ctx = $('<canvas/>').appendTo(object);

  // plot first two columns
  //var myChart = new Chart(ctx, {
  object.plot([preparePoints(keys[0], keys[1])]);
  //});
}

// stuff to run on load
activateEditors();
renderMathInElement(document.body);
