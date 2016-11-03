'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _child_process = require('child_process');

var _path = require('path');

var _parsers = require('./parsers');

require('core-js/shim');

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var DEFAULT_PROTRACTOR_ARGS = [];

var DEFAULT_OPTIONS = {
  nodeBin: 'node',
  maxAttempts: 3,
  protractorArgs: DEFAULT_PROTRACTOR_ARGS,
  parser: 'standard',
  retryArgs: '',
  retryInitialSpec: '',
  retryFinalSpec: ''
};

function filterArgs(protractorArgs) {
  protractorArgs = protractorArgs.filter(function (arg) {
    return !/^--(suite|specs)=/.test(arg);
  });
  ['--suite', '--specs'].forEach(function (item) {
    var index = protractorArgs.indexOf(item);
    if (index !== -1) {
      protractorArgs.splice(index, 2);
    }
  });
  return protractorArgs;
}

exports['default'] = function () {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var callback = arguments.length <= 1 || arguments[1] === undefined ? function noop() {} : arguments[1];

  var parsedOptions = Object.assign(DEFAULT_OPTIONS, options);
  var parser = (0, _parsers.getParser)(parsedOptions.parser);
  var testAttempt = 1;

  function handleTestEnd(status) {
    var output = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

    if (status === 0) {
      callback(status);
    } else {
      if (++testAttempt <= parsedOptions.maxAttempts) {
        (0, _logger2['default'])('info', '\nUsing ' + parser.name + ' to parse output\n');
        var failedSpecs = parser.parse(output);

        (0, _logger2['default'])('info', 'Re-running tests: test attempt ' + testAttempt + '\n');
        if (failedSpecs.length === 0) {
          (0, _logger2['default'])('info', '\nTests failed but no specs were found. All specs will be run again.\n\n');
        } else {
          (0, _logger2['default'])('info', 'Re-running the following test files:\n');
          (0, _logger2['default'])('info', failedSpecs.join('\n') + '\n');
        }
        return startProtractor(failedSpecs);
      }

      callback(status, output);
    }
  }

  function startProtractor() {
    var specFiles = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    var protractorBinPath = undefined;
    if (parsedOptions.protractorPath) {
      protractorBinPath = (0, _path.resolve)(parsedOptions.protractorPath);
    } else {
      // '.../node_modules/protractor/lib/protractor.js'
      var protractorMainPath = require.resolve('protractor');
      // '.../node_modules/protractor/bin/protractor'
      protractorBinPath = (0, _path.resolve)(protractorMainPath, '../../bin/protractor');
    }

    var protractorArgs = [protractorBinPath].concat(parsedOptions.protractorArgs);
    var output = '';

    if (specFiles.length) {
      protractorArgs = filterArgs(protractorArgs);

      // If retryInitialSpec is specifed, add it to the beginning of specFiles array
      parsedOptions.retryInitialSpec && specFiles.unshift(parsedOptions.retryInitialSpec);

      // If retryFinalSpec is specifed, append it to the end of specFiles array
      parsedOptions.retryFinalSpec && specFiles.push(parsedOptions.retryFinalSpec);

      protractorArgs.push('--specs', specFiles.join(','));

      //Add parameters to set/override values in protractor.conf.js file in event of spec failure
      if (parsedOptions.retryArgs.length) {
        protractorArgs = protractorArgs.concat(parsedOptions.retryArgs.split(','));
      }
    }

    var protractor = (0, _child_process.spawn)(parsedOptions.nodeBin, protractorArgs, options.protractorSpawnOptions);

    protractor.stdout.on('data', function (buffer) {
      var text = buffer.toString();
      (0, _logger2['default'])('info', text);
      output = output + text;
    });

    protractor.stderr.on('data', function (buffer) {
      var text = buffer.toString();
      (0, _logger2['default'])('info', text);
      output = output + text;
    });

    protractor.on('exit', function (status) {
      handleTestEnd(status, output);
    });
  }

  startProtractor();
};

module.exports = exports['default'];