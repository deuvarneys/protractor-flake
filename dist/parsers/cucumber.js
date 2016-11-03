'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = {
  name: 'cucumber',

  parse: function parse(output) {
    var match = null;
    var failedSpecs = [];
    var FAILED_LINES = /(.*?):\d+ # Scenario:.*/g;
    while (match = FAILED_LINES.exec(output)) {
      // eslint-disable-line no-cond-assign
      failedSpecs.push(match[1]);
    }

    return failedSpecs;
  }
};
module.exports = exports['default'];