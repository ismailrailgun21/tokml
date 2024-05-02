const style = require('../lib/style');

var test = require('tap').test,
    fs = require('fs'),
    path = require('path');

test('style', function(t) {

    function geq(t, name) {
      var input = file(name + '.json');
      var expected = style(input.properties, input.styleHash);

      if (process.env.UPDATE) {
        fs.writeFileSync(path.join(__dirname, '/data/', name + '.kml'), expected);
      }

      t.equal(expected, output(name + '.kml'), name);
    }

    t.test('Style spec', function(tt) {
      geq(tt, 'style_single_marker_color_short');
      geq(tt, 'style_single_marker_color_long');
      geq(tt, 'style_all_props');
      geq(tt, 'style_stroke_props_only');
      geq(tt, 'style_non_marker_props');
        
      tt.end();
    });

    t.end();
});


function file(f) {
    return JSON.parse(fs.readFileSync(__dirname + '/data/' + f));
}

function output(f) {
    return fs.readFileSync(__dirname + '/data/' + f, 'utf8');
}
