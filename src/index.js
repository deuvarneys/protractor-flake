import {spawn} from 'child_process'
import {resolve} from 'path'
import {getParser} from './parsers'
import 'core-js/shim'
import log from './logger'
import _ from 'lodash';

const DEFAULT_PROTRACTOR_ARGS = []

const DEFAULT_OPTIONS = {
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

}

function filterArgs (protractorArgs) {
  protractorArgs = protractorArgs.filter((arg) => !/^--(suite|specs)=/.test(arg));
  ['--suite', '--specs'].forEach((item) => {
    let index = protractorArgs.indexOf(item)
    if (index !== -1) {
      protractorArgs.splice(index, 2)
    }
  })
  return protractorArgs
}

export default function (options = {}, callback = function noop () {}) {
  let parsedOptions = Object.assign(DEFAULT_OPTIONS, options)
  let parser = getParser(parsedOptions.parser)
  let testAttempt = 1

  function handleTestEnd (status, output = '') {
    if (status === 0) {
      callback(status)
    } else {
      if (++testAttempt <= parsedOptions.maxAttempts) {
        log('info', `\nUsing ${parser.name} to parse output\n`)
        let failedSpecs = parser.parse(output)

        log('info', `Re-running tests: test attempt ${testAttempt}\n`)
        if (failedSpecs.length === 0) {
          log('info', '\nTests failed but no specs were found. All specs will be run again.\n\n')
        } else {
          log('info', 'Re-running the following test files:\n')
          log('info', failedSpecs.join('\n') + '\n')
        }
        return startProtractor(failedSpecs)
      }

      callback(status, output)
    }
  }

  function startProtractor (specFiles = []) {
    let protractorBinPath
    if (parsedOptions.protractorPath) {
      protractorBinPath = resolve(parsedOptions.protractorPath)
    } else {
      // '.../node_modules/protractor/lib/protractor.js'
      let protractorMainPath = require.resolve('protractor')
      // '.../node_modules/protractor/bin/protractor'
      protractorBinPath = resolve(protractorMainPath, '../../bin/protractor')
    }

    let protractorArgs = [protractorBinPath].concat(parsedOptions.protractorArgs)
    let output = ''

    if (specFiles.length) {

      //Remove duplicate failed specFiles (All specs are running in one browser with retry logic)
      // Using uniqBy as uniq has a bug since lodash 4.0
      specFiles = _.uniqBy(specFiles, (spec) => (
        spec
      ));

      protractorArgs = filterArgs(protractorArgs)

      //Do not rerun specified specs if they failed
      if (protractorArgs.retryDoNotRerunFailedSpecs){
        //Get array of do not rerun specs
        const doNotRerunFailedSpecs = protractorArgs.retryDoNotRerunFailedSpecs.split(',');
        //Filter out specs that are not in rerun list
        specFiles = specFiles.filter((failedSpec) => (
          // Return inverse of specs that are in doNotRerunFailedSpecs array
          !_.some(doNotRerunFailedSpecs, (doNotReRunSpec) => {
              return failedSpec.indexOf(doNotReRunSpec)
          })

        ));
      }


      const foundFailedInitailSpecs = [];
      if (protractorArgs.retryInitialSpecsIfInFailedSpecs){
        //Get array retryInitialSpecsIfInFailedSpecs
        const retryInitialSpecsIfInFailedSpecs = protractorArgs.retryInitialSpecsIfInFailedSpecs.split(',');

        retryInitialSpecsIfInFailedSpecs.forEach((initalFailedSpec) => {
          specFiles.forEach((failedSpec)=> {
            if(failedSpec.indexOf(initalFailedSpec) !== -1){
              foundFailedInitailSpecs.push(failedSpec);
            }
          });
        });

        //Remove elements from specFiles found in foundFailedInitailSpecs
        _.pullAllWith(specFiles, foundFailedInitailSpecs, _.isEqual);
        //Move Specs to the beginning of specFiles array
        specFiles = foundFailedInitailSpecs.concat(specFiles);
      }


      const foundFailedEndSpecs = [];
      if (protractorArgs.retryFinalSpecsIfInFailedSpecs){
        //Get array retryFinalSpecsIfInFailedSpecs
        const retryFinalSpecsIfInFailedSpecs = protractorArgs.retryFinalSpecsIfInFailedSpecs.split(',');

        retryFinalSpecsIfInFailedSpecs.forEach((finalFailedSpecs) => {
          specFiles.forEach((failedSpec)=> {
            if(failedSpec.indexOf(finalFailedSpecs) !== -1){
              foundFailedEndSpecs.push(failedSpec);
            }
          });
        });

        //Remove elements from specFiles found in foundFailedEndSpecs
        _.pullAllWith(specFiles, foundFailedEndSpecs, _.isEqual);
        //Move Specs to the end of specFiles file
        specFiles = specFiles.concat(foundFailedEndSpecs);
      }


      // If retryInitialSpec is specifed, add it to the beginning of specFiles array
      parsedOptions.retryInitialSpec && !foundFailedInitailSpecs.length && specFiles.unshift(parsedOptions.retryInitialSpec);

      // If retryFinalSpec is specifed, append it to the end of specFiles array
      parsedOptions.retryFinalSpec && !foundFailedEndSpecs.length && specFiles.push(parsedOptions.retryFinalSpec);

      protractorArgs.push('--specs', specFiles.join(','));

      //Add parameters to set/override values in protractor.conf.js file in event of spec failure
      if (parsedOptions.retryArgs){
        protractorArgs = protractorArgs.concat(parsedOptions.retryArgs.split(','));
      }

    }

    let protractor = spawn(
      parsedOptions.nodeBin,
      protractorArgs,
      options.protractorSpawnOptions
    )

    protractor.stdout.on('data', (buffer) => {
      let text = buffer.toString()
      log('info', text)
      output = output + text
    })

    protractor.stderr.on('data', (buffer) => {
      let text = buffer.toString()
      log('info', text)
      output = output + text
    })

    protractor.on('exit', function (status) {
      handleTestEnd(status, output)
    })
  }

  startProtractor()
}
