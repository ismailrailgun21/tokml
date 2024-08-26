const defaultOptions = require('./defaultOptions')
const strxml = require('./strxml')
const tag = strxml.tag

const defaultPointColor = '7e7e7e'
const defaultPolyAndLineColor = '555555'

module.exports = function style(_, styleHash, options) {
  options = options || defaultOptions()

  const points = pointStyle(_, options)
  const polysAndLines = polygonAndLineStyles(_)
  const hotSpot = iconSize(_)

  return tag('Style', { id: styleHash }, points + polysAndLines + hotSpot)
}

function currentColor(_) {
  let markerColor =
    hexToKmlColor(_['marker-color']) ||
    currentPolyColor(_) ||
    currentLineColor(_)

  return markerColor || forceOpacity(defaultPointColor, 'ff')
}

function currentColorRawValue(_) {
  return _['marker-color'] || _['fill'] || _['stroke'] || defaultPointColor
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
  const colorMode = newColorModeTag()
  const icon = tag('Icon', tag('href', iconUrl(_, options)))

  return tag('IconStyle', color + colorMode + icon)
}

function forceOpacity(color, opacity) {
  return opacity + color.slice(-6)
}

function polygonAndLineStyles(_) {
  const color = currentColor(_)
  let lineColor = color
  let lineWidth = _['stroke-width'] === undefined ? 2 : _['stroke-width']
  let polyColor = forceOpacity(color, '88')

  if (_['stroke' || _['stroke-opacity']]) {
    lineColor =
      currentLineColor(_) || forceOpacity(defaultPolyAndLineColor, 'ff')
  }

  if (_['fill'] || _['fill-opacity']) {
    polyColor =
      currentPolyColor(_) || forceOpacity(defaultPolyAndLineColor, '88')
  }

  const widthTag = tag('width', String(lineWidth))
  const lineColorTag = tag('color', lineColor)
  const polyTag = tag('color', polyColor)
  const lineStyle = tag(
    'LineStyle',
    lineColorTag + newColorModeTag() + widthTag
  )
  const polyStyle = tag('PolyStyle', polyTag + newColorModeTag())

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
    color = (currentColorRawValue(_) || defaultPointColor).replace('#', ''),
    icon = _['marker-icon'] || ''

  return (
    icon ??
    'https://api.tiles.mapbox.com/v3/marker/' +
      'pin-' +
      size.charAt(0) +
      symbol +
      '+' +
      color +
      '.png'
  )
}
