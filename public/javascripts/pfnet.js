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
    parent.prepend($('<button>Run</button>').on('click', function() {
      $.post('/api', { action: 'setup', input: editor.getValue() }, function(data) {
        if (data.status === 'error') {
          alert(data.message);
        }

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

            if ('exit' in msg)
            {
              if (msg.exit == 0) {
                output.css({ 'border-color': 'green'});
              } else {
                output.css({ 'border-color': 'red'});
              }
            } else {
              var html = msg.stdout || msg.stderr;
              if (html) {
                output.append(html);
              }
            }
          }
        }
      });
    }));
  });
}
