
const strxml = require('./strxml');
const tag = strxml.tag;
const esc = require('./xml-escape');

module.exports = function extendedData(_) {
  return tag('ExtendedData', {}, pairs(_).map(data).join(''))
}

function data(_) {
  return tag(
    'Data',
    { name: _[0] },
    tag('value', {}, esc(_[1] ? _[1].toString() : ''))
  )
}

// ## General helpers
function pairs(_) {
  var o = []
  for (var i in _) {
    if (_[i]) {
      o.push([i, _[i]])
    } else {
      o.push([i, ''])
    }
  }
  return o
}
