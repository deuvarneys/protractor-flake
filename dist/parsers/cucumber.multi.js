'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

exports['default'] = {
  name: 'cucumberMulti',
  parse: function parse(output) {
    var match = null;
    var failedSpecs = [];
    var testsOutput = output.split('------------------------------------');
    var RESULT_FAIL = 'Failures:';
    var SPECFILE_REG = /Specs:\s(.*\.feature)/g;
    testsOutput.forEach(function (test) {
      // only check specs when RESULT_FAIL, ` Specs: ` is always printed when at least multiple features on 1 instance
      // are run with `shardTestFiles: true`
      if (test.indexOf(RESULT_FAIL) > -1) {
        // eslint-disable-line no-cond-assign
        while (match = SPECFILE_REG.exec(test)) {
          // eslint-disable-line no-cond-assign
          failedSpecs.push(match[1]);
        }
      }
    });
    // Remove double values
    return [].concat(_toConsumableArray(new Set(failedSpecs)));
  }
};
module.exports = exports['default'];