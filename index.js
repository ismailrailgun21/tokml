const style = require('./lib/style')
const extendedData = require('./lib/extendedData')
const geometry = require('./lib/geometry')
const placemark = require('./lib/placemark')
const defaultOptions = require('./lib/defaultOptions')
var strxml = require('./lib/strxml'),
  tag = strxml.tag

module.exports = function tokml(geojson, options) {
  options = options || defaultOptions()

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    tag(
      'kml',
      { xmlns: 'http://www.opengis.net/kml/2.2' },
      tag(
        'Document',
        documentName(options) +
          documentDescription(options) +
          root(geojson, options)
      )
    )
  )
}

function feature(options, styleHashesArray) {
  return function (_) {
    if (
      !_.properties ||
      !geometry.valid(_.geometry) ||
      !geometry.any(_.geometry)
    )
      return ''

    let styleDefinition = ''

    let extendeddata
    if (_.geometry?.type === 'GeometryCollection') {
      extendeddata = extendedData(_.properties)
    }

    if (options.simplestyle) {
      var styleHash = hashStyle(_.properties)
      if (styleHash) {
        const styleTag = style(_.properties, styleHash, options)

        if (styleHashesArray.indexOf(styleHash) === -1) {
          styleHashesArray.push(styleHash)
          styleDefinition = styleTag
        }

        removeMarkerStyle(_.properties)
        removePolygonAndLineStyle(_.properties)
        // Note that style of GeometryCollection / MultiGeometry is not supported
      }
    }

    if (!extendeddata) {
      extendeddata = extendedData(_.properties)
    }

    return styleDefinition + placemark(_, styleHash, options, extendeddata)
  }
}

function root(_, options) {
  if (!_.type) return ''
  var styleHashesArray = []

  switch (_.type) {
    case 'FeatureCollection':
      if (!_.features) return ''
      return _.features.map(feature(options, styleHashesArray)).join('')
    case 'Feature':
      return feature(options, styleHashesArray)(_)
    default:
      return feature(
        options,
        styleHashesArray
      )({
        type: 'Feature',
        geometry: _,
        properties: {}
      })
  }
}

function documentName(options) {
  return options.documentName !== undefined
    ? tag('name', options.documentName)
    : ''
}

function documentDescription(options) {
  return options.documentDescription !== undefined
    ? tag('description', options.documentDescription)
    : ''
}

function removeMarkerStyle(_) {
  delete _['marker-size']
  delete _['marker-symbol']
  delete _['marker-icon']
  delete _['marker-color']
  delete _['marker-shape']
}

function removePolygonAndLineStyle(_) {
  delete _['stroke']
  delete _['stroke-opacity']
  delete _['stroke-width']
  delete _['fill']
  delete _['fill-opacity']
}

// ## Style helpers
function hashStyle(_) {
  var hash = ''

  if (_['marker-symbol']) hash = hash + 'ms' + _['marker-symbol']
  if (_['marker-icon']) hash = hash + 'mi' + _['marker-icon']
  if (_['marker-color']) hash = hash + 'mc' + _['marker-color'].replace('#', '')
  if (_['marker-size']) hash = hash + 'ms' + _['marker-size']
  if (_['stroke']) hash = hash + 's' + _['stroke'].replace('#', '')
  if (_['stroke-width'])
    hash = hash + 'sw' + _['stroke-width'].toString().replace('.', '')
  if (_['stroke-opacity'])
    hash = hash + 'mo' + _['stroke-opacity'].toString().replace('.', '')
  if (_['fill']) hash = hash + 'f' + _['fill'].replace('#', '')
  if (_['fill-opacity'])
    hash = hash + 'fo' + _['fill-opacity'].toString().replace('.', '')

  return hash
}
