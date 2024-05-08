## 0.7.0

- Outputs each `styleHash` with `IconStyle`, `LineStyle` and `PolyStyle` nodes
- Allows specifying an `iconUrl` in `options` to overwrite the `href` on each `Icon`

## 0.6.1

- Fix #4 error with non-string id values
- Upgrade dev dependencies to fix tests and pass code coverage check

## 0.6.0

- Fix #2 setting the `simplestyle` option will now exclude the options from the `<ExtendedData>` of the KML
- Upgrade dependencies
- Simplify dependencies by removing unused website and moving helper functions into this repo

## 0.5.2

- Add support for placemark ID attributes https://github.com/mapbox/tokml/issues/39

## 0.5.0

- Upgrade dependencies to resolve security audit warnings

## 0.4.0

- Adds support for simplestyle-spec. Thanks [Vincent Sels!](https://github.com/vincentsels)

## 0.3.0

- Add support for encoding the KML TimeStamp tag from a field in a GeoJSON
  properties object

## 0.2.5

- Fixes order of Geometry and ExtendedData tags in Placemarks

## 0.2.3

- Tolerates empty Polygon coordinates
- Tolerates empty geometry collections

## 0.2.2

- Fix formatting of `ExtendedData` sections
- Improved CLI help

## 0.2.1

- Fix encoded output of non-string data values

## 0.2.0

- [simplestyle-spec](https://github.com/mapbox/simplestyle-spec) support
- better help for the `tokml` binary

## 0.1.0

- Support document name and description properties.

## 0.0.3

- Support bare features and geometries.
