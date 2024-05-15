(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.tokml = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const style = require('./lib/style')
const extendedData = require('./lib/extendedData')
const geometry = require('./lib/geometry');
const placemark = require('./lib/placemark');
const defaultOptions = require('./lib/defaultOptions');
var strxml = require('./lib/strxml'),
  tag = strxml.tag

module.exports = function tokml(geojson, options) {
  options = options || defaultOptions();

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
    if (!_.properties || !geometry.valid(_.geometry) || !geometry.any(_.geometry)) return ''

    let styleDefinition = '';

    let extendeddata;
    if (_.geometry?.type === 'GeometryCollection') {
      extendeddata = extendedData(_.properties);
    }

    if (options.simplestyle) {
      var styleHash = hashStyle(_.properties)
      if (styleHash) {

        const styleTag = style(_.properties, styleHash, options);

        if (styleHashesArray.indexOf(styleHash) === -1) {
          styleHashesArray.push(styleHash);
          styleDefinition = styleTag;
        }

        removeMarkerStyle(_.properties);
        removePolygonAndLineStyle(_.properties);
        // Note that style of GeometryCollection / MultiGeometry is not supported
      }
    }

    if (!extendeddata) {
      extendeddata = extendedData(_.properties);
    }

    return (
      styleDefinition + placemark(_, styleHash, options, extendeddata)
    )
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

},{"./lib/defaultOptions":2,"./lib/extendedData":3,"./lib/geometry":4,"./lib/placemark":5,"./lib/strxml":6,"./lib/style":7}],2:[function(require,module,exports){
module.exports = function defaultOptions() {
  return {
    documentName: undefined,
    documentDescription: undefined,
    name: 'name',
    description: 'description',
    simplestyle: false,
    timestamp: 'timestamp'
  }
}
},{}],3:[function(require,module,exports){

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

},{"./strxml":6,"./xml-escape":8}],4:[function(require,module,exports){
const strxml = require('./strxml');
const tag = strxml.tag;

// https://developers.google.com/kml/documentation/kmlreference#geometry
const geometry = {
  Point: function (_) {
    return tag('Point', tag('coordinates', _.coordinates.join(',')))
  },
  LineString: function (_) {
    return tag('LineString', tag('coordinates', linearring(_.coordinates)))
  },
  Polygon: function (_) {
    if (!_.coordinates.length) return ''
    var outer = _.coordinates[0],
      inner = _.coordinates.slice(1),
      outerRing = tag(
        'outerBoundaryIs',
        tag('LinearRing', tag('coordinates', linearring(outer)))
      ),
      innerRings = inner
        .map(function (i) {
          return tag(
            'innerBoundaryIs',
            tag('LinearRing', tag('coordinates', linearring(i)))
          )
        })
        .join('')
    return tag('Polygon', outerRing + innerRings)
  },
  MultiPoint: function (_) {
    if (!_.coordinates.length) return ''
    return tag(
      'MultiGeometry',
      _.coordinates
        .map(function (c) {
          return geometry.Point({ coordinates: c })
        })
        .join('')
    )
  },
  MultiPolygon: function (_) {
    if (!_.coordinates.length) return ''
    return tag(
      'MultiGeometry',
      _.coordinates
        .map(function (c) {
          return geometry.Polygon({ coordinates: c })
        })
        .join('')
    )
  },
  MultiLineString: function (_) {
    if (!_.coordinates.length) return ''
    return tag(
      'MultiGeometry',
      _.coordinates
        .map(function (c) {
          return geometry.LineString({ coordinates: c })
        })
        .join('')
    )
  },
  GeometryCollection: function (_) {
    return tag('MultiGeometry', _.geometries.map(geometry.any).join(''))
  },
  valid: function (_) {
    return (
      _ &&
      _.type &&
      (_.coordinates ||
        (_.type === 'GeometryCollection' &&
          _.geometries &&
          _.geometries.every(geometry.valid)))
    )
  },
  any: function (_) {
    if (geometry[_.type]) {
      return geometry[_.type](_)
    } else {
      return ''
    }
  },
  isPoint: function (_) {
    return _.type === 'Point' || _.type === 'MultiPoint'
  },
  isPolygon: function (_) {
    return _.type === 'Polygon' || _.type === 'MultiPolygon'
  },
  isLine: function (_) {
    return _.type === 'LineString' || _.type === 'MultiLineString'
  }
}

function linearring(_) {
  return _.map(function (cds) {
    return cds.join(',')
  }).join(' ')
}

module.exports = geometry;
},{"./strxml":6}],5:[function(require,module,exports){
const defaultOptions = require('./defaultOptions');
const extendedData = require('./extendedData');
const geometry = require('./geometry');
const strxml = require('./strxml');
const tag = strxml.tag;
const esc = require('./xml-escape');

module.exports = function placemark(_, styleHash, options, extendeddata) {
  options = options ?? defaultOptions();

  const id = _.id?.toString();
  const attrs = {};
  if (id) {
    attrs.id = id;
  }

  const data = extendeddata ?? extendedData(_.properties);
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

},{"./defaultOptions":2,"./extendedData":3,"./geometry":4,"./strxml":6,"./xml-escape":8}],6:[function(require,module,exports){
/* istanbul ignore file */
// strxml from https://github.com/mapbox/strxml

var esc = require('./xml-escape')

module.exports.attr = attr
module.exports.tagClose = tagClose
module.exports.tag = tag

/**
 * @param {array} _ an array of attributes
 * @returns {string}
 */
function attr(attributes) {
  if (!Object.keys(attributes).length) return ''
  return (
    ' ' +
    Object.keys(attributes)
      .map(function (key) {
        return key + '="' + esc(attributes[key]) + '"'
      })
      .join(' ')
  )
}

/**
 * @param {string} el element name
 * @param {array} attributes array of pairs
 * @returns {string}
 */
function tagClose(el, attributes) {
  return '<' + el + attr(attributes) + '/>'
}

/**
 * @param {string} el element name
 * @param {string} contents innerXML
 * @param {array} attributes array of pairs
 * @returns {string}
 */
function tag(el, attributes, contents) {
  if (Array.isArray(attributes) || typeof attributes === 'string') {
    contents = attributes
    attributes = {}
  }
  if (Array.isArray(contents))
    contents =
      '\n' +
      contents
        .map(function (content) {
          return '  ' + content
        })
        .join('\n') +
      '\n'
  return '<' + el + attr(attributes) + '>' + contents + '</' + el + '>'
}

},{"./xml-escape":8}],7:[function(require,module,exports){
const defaultOptions = require('./defaultOptions');
const strxml = require('./strxml')
const tag = strxml.tag

const defaultPointColor = '7e7e7e';
const defaultPolyAndLineColor = '555555'

module.exports = function style(_, styleHash, options) {
  options = options || defaultOptions();

  const points = pointStyle(_, options);
  const polysAndLines = polygonAndLineStyles(_);
  const hotSpot = iconSize(_);

  return tag('Style', { id: styleHash}, points + polysAndLines + hotSpot);
}

function currentColor(_) {
  let markerColor = hexToKmlColor(_['marker-color']) || currentPolyColor(_) || currentLineColor(_);

  return markerColor || forceOpacity(defaultPointColor, 'ff');
}

function currentColorRawValue(_) {
  return _['marker-color'] || _['fill'] || _['stroke'] || defaultPointColor;
}

function currentLineColor(_) {
  return hexToKmlColor(_['stroke'], _['stroke-opacity'])
}

function currentPolyColor(_) {
  return hexToKmlColor(_['fill'], _['fill-opacity'])
}

function newColorModeTag() {
  return tag('colorMode', 'normal')
}

function pointStyle(_, options) {
  const color = tag('color', forceOpacity(currentColor(_), 'ff'))
  const colorMode = newColorModeTag();
  const icon = tag('Icon', tag('href', iconUrl(_, options)))

  return tag('IconStyle', color + colorMode + icon)
}

function forceOpacity(color, opacity) {
  return opacity + color.slice(-6);
}

function polygonAndLineStyles(_) {
  const color = currentColor(_);
  let lineColor = color;
  let lineWidth = _['stroke-width'] === undefined ? 2 : _['stroke-width'];
  let polyColor = forceOpacity(color, '88');

  if (_['stroke' || _['stroke-opacity']]) {
    lineColor = currentLineColor(_) || forceOpacity(defaultPolyAndLineColor, 'ff');
  }

  if (_['fill'] || _['fill-opacity']) {
    polyColor = currentPolyColor(_)  || forceOpacity(defaultPolyAndLineColor, '88')
  }

  const widthTag = tag('width', String(lineWidth));
  const lineColorTag = tag('color', lineColor);
  const polyTag = tag('color', polyColor);
  const lineStyle = tag('LineStyle', lineColorTag + newColorModeTag() + widthTag);
  const polyStyle = tag('PolyStyle', polyTag + newColorModeTag());

  return lineStyle + polyStyle
}

function iconSize(_) {
  return tag(
    'hotSpot',
    {
      xunits: 'fraction',
      yunits: 'fraction',
      x: '0.5',
      y: '0.5'
    },
    ''
  )
}

function hexToKmlColor(hexColor, opacity) {
  if (typeof hexColor !== 'string') return ''

  hexColor = hexColor.replace('#', '').toLowerCase()

  if (hexColor.length === 3) {
    hexColor =
      hexColor[0] +
      hexColor[0] +
      hexColor[1] +
      hexColor[1] +
      hexColor[2] +
      hexColor[2]
  } else if (hexColor.length !== 6) {
    return ''
  }

  var r = hexColor[0] + hexColor[1]
  var g = hexColor[2] + hexColor[3]
  var b = hexColor[4] + hexColor[5]

  var o = 'ff'
  if (typeof opacity === 'number' && opacity >= 0.0 && opacity <= 1.0) {
    o = (opacity * 255).toString(16)
    if (o.indexOf('.') > -1) o = o.substr(0, o.indexOf('.'))
    if (o.length < 2) o = '0' + o
  }

  return o + b + g + r
}

function iconUrl(_, options) {
  return options?.iconUrl ?? legacyIconUrl(_)
}

function legacyIconUrl(_) {
  var size = _['marker-size'] || 'medium',
    symbol = _['marker-symbol'] ? '-' + _['marker-symbol'] : '',
    color = (currentColorRawValue(_) || defaultPointColor).replace('#', '')

  return (
    'https://api.tiles.mapbox.com/v3/marker/' +
    'pin-' +
    size.charAt(0) +
    symbol +
    '+' +
    color +
    '.png'
  )
}

},{"./defaultOptions":2,"./strxml":6}],8:[function(require,module,exports){
/* istanbul ignore file */
// originally from https://github.com/miketheprogrammer/xml-escape

var escape = (module.exports = function escape(string, ignore) {
  var pattern

  if (string === null || string === undefined) return

  ignore = (ignore || '').replace(/[^&"<>\']/g, '')
  pattern = '([&"<>\'])'.replace(new RegExp('[' + ignore + ']', 'g'), '')

  return string.replace(new RegExp(pattern, 'g'), function (str, item) {
    return escape.map[item]
  })
})

var map = (escape.map = {
  '>': '&gt;',
  '<': '&lt;',
  "'": '&apos;',
  '"': '&quot;',
  '&': '&amp;'
})

},{}]},{},[1])(1)
});
