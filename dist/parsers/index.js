'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _cucumber = require('./cucumber');

var _cucumber2 = _interopRequireDefault(_cucumber);

var _cucumberMulti = require('./cucumber.multi');

var _cucumberMulti2 = _interopRequireDefault(_cucumberMulti);

var _path = require('path');

var _multi = require('./multi');

var _multi2 = _interopRequireDefault(_multi);

var _standard = require('./standard');

var _standard2 = _interopRequireDefault(_standard);

var all = { cucumber: _cucumber2['default'], cucumberMulti: _cucumberMulti2['default'], multi: _multi2['default'], standard: _standard2['default'] };

function handlePath(parserPath) {
  try {
    parserPath = process.cwd() + '/' + parserPath;
    var customParserPath = require.resolve(parserPath);
    return require(customParserPath);
  } catch (e) {
    throw new Error('Invalid Custom Parser Path Specified: ' + parserPath);
  }
}

function handleFlakeParser(parserName) {
  if (all[parserName]) {
    return all[parserName];
  } else {
    throw new Error('Invalid Parser Specified: ' + parserName);
  }
}

function getParser() {
  var parser = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

  // Not exactly sure what this is for yet
  // if (parser.hasOwnProperty('parse')) {
  //   return handleObject(parser)
  // }
  if ((0, _path.extname)(parser)) {
    return handlePath(parser);
  }

  return handleFlakeParser(parser);
}

exports['default'] = { all: all, getParser: getParser };
module.exports = exports['default'];