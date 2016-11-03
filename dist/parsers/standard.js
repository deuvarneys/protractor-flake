'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

exports['default'] = {
  name: 'standard',

  parse: function parse(output) {
    var failedSpecs = new Set();
    var match = null;
    var FAILED_LINES = /at (?:\[object Object\]|Object)\.<anonymous> \((([A-Za-z]:\\)?.*?):.*\)/g;
    while (match = FAILED_LINES.exec(output)) {
      // eslint-disable-line no-cond-assign
      // windows output includes stack traces from
      // webdriver so we filter those out here
      if (!/node_modules/.test(match[1])) {
        failedSpecs.add(match[1]);
      }
    }

    return [].concat(_toConsumableArray(failedSpecs));
  }
};
module.exports = exports['default'];