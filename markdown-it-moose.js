const pug = require('pug');
const fs  = require('fs');

const EMBED_REGEX = /^@moose\s+(.*)$/im;

function tokenize(state, silent)
{
  var theState = state;
  const oldPos = state.pos;

  if (state.src.charCodeAt(oldPos) !== 0x40) { /* @ */
    return false;
  }

  const match = EMBED_REGEX.exec(state.src.slice(state.pos, state.src.length));
  if (!match) {
    return false;
  }

  if (!silent) {
    token = theState.push('moose', '');
    token.inputFile = match[1];
    token.level = theState.level;
  }

  theState.pos += match[0].length;
  theState.posMax = theState.tokens.length;
  return true;
}

function render(tokens, idx)
{
  var data = fs.readFileSync('inputs/' + tokens[idx].inputFile, 'utf8');
  // console.log(pug.renderFile('views/input.pug', {
  //   input: data
  // }));
  // return '<tt>' + 'inputs/' + tokens[idx].inputFile + '</tt>'
  return pug.renderFile('views/input.pug', {
    input: data
  });
}

module.exports = function(md) {
  md.inline.ruler.before('emphasis', "moose", tokenize);
  md.renderer.rules["moose"] = render;
};
