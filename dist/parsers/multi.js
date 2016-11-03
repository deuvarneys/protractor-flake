'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = {
  name: 'multi',

  parse: function parse(output) {
    var match = null;
    var failedSpecs = [];
    var testsOutput = output.split('------------------------------------');
    var RESULT_REG = /,\s0 failures/g;
    var SPECFILE_REG = /.+Specs:\s(.*\.js)/g;
    testsOutput.forEach(function (test) {
      var specfile = undefined;
      var result = 'failed';
      // retrieve specfile from run
      while (match = SPECFILE_REG.exec(test)) {
        // eslint-disable-line no-cond-assign
        specfile = match[1];
      }
      // check for string '0 failures' and then marks the test as passed
      while (match = RESULT_REG.exec(test)) {
        // eslint-disable-line no-cond-assign
        result = 'passed';
      }
      if (specfile && result === 'failed') {
        if (!/node_modules/.test(specfile)) {
          failedSpecs.push(specfile);
        }
      }
    });

    return failedSpecs;
  }
};
module.exports = exports['default'];