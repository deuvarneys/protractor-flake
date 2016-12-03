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

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var DEFAULT_PROTRACTOR_ARGS = [];

var DEFAULT_OPTIONS = {
  nodeBin: 'node',
  maxAttempts: 3,
  protractorArgs: DEFAULT_PROTRACTOR_ARGS,
  parser: 'standard',
  retryArgs: '',
  retryInitialSpec: '',
  retryFinalSpec: '',
  retryInitialSpecsIfInFailedSpecs: '',
  retryFinalSpecsIfInFailedSpecs: '',
  retryDoNotRerunFailedSpecs: ''

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
      (function () {

        //Remove duplicate failed specFiles (All specs are running in one browser with retry logic)
        // Using uniqBy as uniq has a bug since lodash 4.0
        specFiles = _lodash2['default'].uniqBy(specFiles, function (spec) {
          return spec;
        });

        protractorArgs = filterArgs(protractorArgs);

        //Do not rerun specified specs if they failed
        if (protractorArgs.retryDoNotRerunFailedSpecs) {
          (function () {
            //Get array of do not rerun specs
            var doNotRerunFailedSpecs = protractorArgs.retryDoNotRerunFailedSpecs.split(',');
            //Filter out specs that are not in rerun list
            specFiles = specFiles.filter(function (failedSpec) {
              return(
                // Return inverse of specs that are in doNotRerunFailedSpecs array
                !_lodash2['default'].some(doNotRerunFailedSpecs, function (doNotReRunSpec) {
                  return failedSpec.indexOf(doNotReRunSpec);
                })
              );
            });
          })();
        }

        var foundFailedInitailSpecs = [];
        if (protractorArgs.retryInitialSpecsIfInFailedSpecs) {
          //Get array retryInitialSpecsIfInFailedSpecs
          var retryInitialSpecsIfInFailedSpecs = protractorArgs.retryInitialSpecsIfInFailedSpecs.split(',');

          retryInitialSpecsIfInFailedSpecs.forEach(function (initalFailedSpec) {
            specFiles.forEach(function (failedSpec) {
              if (failedSpec.indexOf(initalFailedSpec) !== -1) {
                foundFailedInitailSpecs.push(failedSpec);
              }
            });
          });

          //Remove elements from specFiles found in foundFailedInitailSpecs
          _lodash2['default'].pullAllWith(specFiles, foundFailedInitailSpecs, _lodash2['default'].isEqual);
          //Move Specs to the beginning of specFiles array
          specFiles = foundFailedInitailSpecs.concat(specFiles);
        }

        var foundFailedEndSpecs = [];
        if (protractorArgs.retryFinalSpecsIfInFailedSpecs) {
          //Get array retryFinalSpecsIfInFailedSpecs
          var retryFinalSpecsIfInFailedSpecs = protractorArgs.retryFinalSpecsIfInFailedSpecs.split(',');

          retryFinalSpecsIfInFailedSpecs.forEach(function (finalFailedSpecs) {
            specFiles.forEach(function (failedSpec) {
              if (failedSpec.indexOf(finalFailedSpecs) !== -1) {
                foundFailedEndSpecs.push(failedSpec);
              }
            });
          });

          //Remove elements from specFiles found in foundFailedEndSpecs
          _lodash2['default'].pullAllWith(specFiles, foundFailedEndSpecs, _lodash2['default'].isEqual);
          //Move Specs to the end of specFiles file
          specFiles = specFiles.concat(foundFailedEndSpecs);
        }

        // If retryInitialSpec is specifed, add it to the beginning of specFiles array
        parsedOptions.retryInitialSpec && !foundFailedInitailSpecs.length && specFiles.unshift(parsedOptions.retryInitialSpec);

        // If retryFinalSpec is specifed, append it to the end of specFiles array
        parsedOptions.retryFinalSpec && !foundFailedEndSpecs.length && specFiles.push(parsedOptions.retryFinalSpec);

        protractorArgs.push('--specs', specFiles.join(','));

        //Add parameters to set/override values in protractor.conf.js file in event of spec failure
        if (parsedOptions.retryArgs) {
          protractorArgs = protractorArgs.concat(parsedOptions.retryArgs.split(','));
        }
      })();
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