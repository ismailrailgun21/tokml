var strxml = require('./strxml'),
  tag = strxml.tag

const defaultPointColor = '7e7e7e';
const defaultPolyAndLineColor = '555555'

module.exports = function style(_, styleHash) {

  const points = pointStyle(_);
  const polysAndLines = polygonAndLineStyles(_);
  const hotSpot = iconSize(_);

  return tag('Style', { id: styleHash}, points + polysAndLines + hotSpot);
}

function currentColor(_) {
  return hexToKmlColor(_['marker-color']) || defaultPointColor;
}

function pointStyle(_) {
  const color = tag('color', currentColor(_))
  const colorMode = tag('colorMode', 'normal')
  const icon = tag('Icon', tag('href', iconUrl(_)))

  return tag('IconStyle', color + colorMode + icon)
}

function polygonAndLineStyles(_) {
  const color = currentColor(_);
  let lineColor = color;
  let lineWidth = 2;
  let polyColor = color.replace('ff', '88');

  if (_['stroke' || _['stroke-opacity']]) {
    lineColor = hexToKmlColor(_['stroke'], _['stroke-opacity']) || `ff${defaultPolyAndLineColor}`;
    lineWidth = _['stroke-width'] === undefined ? 2 : _['stroke-width']
  }

  if (_['fill'] || _['fill-opacity']) {
    polyColor = hexToKmlColor(_['fill'], _['fill-opacity'])  || `88${defaultPolyAndLineColor}`
  }

  console.log("HERE IS LINEWIIID", lineWidth)
  const widthTag = tag('width', String(lineWidth));
  const lineColorTag = tag('color', lineColor);
  const polyTag = tag('color', polyColor);
  console.log("AND NOW???", widthTag)
  const lineStyle = tag('LineStyle', lineColorTag + widthTag);
  const polyStyle = tag('PolyStyle', polyTag);

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

function iconUrl(_) {
  var size = _['marker-size'] || 'medium',
    symbol = _['marker-symbol'] ? '-' + _['marker-symbol'] : '',
    color = (_['marker-color'] || defaultPointColor).replace('#', '')

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
