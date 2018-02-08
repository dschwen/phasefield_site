/***
 *
 * phasefield.net JS functions
 * (c) 2018 Daniel Schwen
 *
 */

// turn on intercative editors
function activateEditors()
{
  $('.mooseinput').wrap('<div class="moosewrapper"></div>').each(function() {
    // get parent and editor
    var parent = $(this).parent();
    var editor = ace.edit(this);
    var socket = null;
    
    // set editor options
    editor.setTheme("ace/theme/github");
    editor.session.setMode("ace/mode/moose");
    editor.setOption("maxLines", 30);
    editor.setOption("minLines", 2);

    // add controls
    var run_button = $('<button>Run</button>').on('click', function() {
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
          // add output area
          parent.find('.mooseoutput').remove();
          var output = $('<pre class="mooseoutput"></pre>').appendTo(parent);
          
          // open socket
          socket = new WebSocket('ws://' + location.host + '/api/?name=' + data.name);

          // display output
          socket.onmessage = function (event) {
            try {
              var msg = JSON.parse(event.data);
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
                output.css({ 'border-color': 'green'});

                // limit output window height and scroll to bottom
                output.css({
                  'max-height': '15em',
                  'overflow': 'scroll'
                }).scrollTop(output[0].scrollHeight);
              } else {
                // an error occured
                output.css({ 'border-color': 'red'});
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
              parent.append(dropdown).append($(<button>View</button>).on('click', () => {
                let file = dropdown.val();
                
              }));  
            }

            // stdout and stderr
            var html = msg.stdout || msg.stderr;
            if (html) {
              output.append(html);
            }
          }
        }
      });
    });
    parent.prepend(run_button);
  });
}
