'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _cucumber = require('./cucumber');

var _cucumber2 = _interopRequireDefault(_cucumber);

var _cucumberMulti = require('./cucumber.multi');

var _cucumberMulti2 = _interopRequireDefault(_cucumberMulti);

var _multi = require('./multi');

var _multi2 = _interopRequireDefault(_multi);

var _standard = require('./standard');

var _standard2 = _interopRequireDefault(_standard);

var all = { cucumber: _cucumber2['default'], cucumberMulti: _cucumberMulti2['default'], multi: _multi2['default'], standard: _standard2['default'] };

function getParser(name) {
  if (name && all[name]) {
    return all[name];
  } else {
    throw new Error('Invalid Parser Specified: ' + name);
  }
}

exports['default'] = { all: all, getParser: getParser };
module.exports = exports['default'];