const extendedData = require('./extendedData');
const geometry = require('./geometry');
const strxml = require('./strxml');
const tag = strxml.tag;
const esc = require('./xml-escape');

module.exports = function placemark(_, styleHash, options, extendeddata) {
  const id = _.id?.toString();
  const attrs = {};
  if (id) {
    attrs.id = id;
  }

  const data = extendeddata || extendedData(_);

  const styleReference = styleHash ? tag('styleUrl', '#' + styleHash) : '';

  return tag(
    'Placemark', 
    attrs, 
    name(_.properties, options) +
      description(_.properties, options) +
      data +
      timestamp(_.properties, options) +
      geometry.any(_.geometry) +
      styleReference
  )
}

function name(_, options) {
  return _[options.name] ? tag('name', esc(_[options.name])) : ''
}

function description(_, options) {
  return _[options.description]
    ? tag('description', esc(_[options.description]))
    : ''
}

function timestamp(_, options) {
  return _[options.timestamp]
    ? tag('TimeStamp', tag('when', esc(_[options.timestamp])))
    : ''
}
