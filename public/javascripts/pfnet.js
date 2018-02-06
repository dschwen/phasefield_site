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
    
    // set editor options
    editor.setTheme("ace/theme/github");
    editor.session.setMode("ace/mode/moose");
    editor.setOption("maxLines", 30);
    editor.setOption("minLines", 2);

    // add controls
    parent.prepend($('<button>Run</button>').on('click', function() {
      $.post('/api', { action: 'setup', input: editor.getValue() }, function(data) {
        console.log(data);
      });
    }));
  });
}
