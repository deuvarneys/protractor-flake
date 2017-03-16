import cucumber from './cucumber'
import cucumberMulti from './cucumber.multi'
import { extname } from 'path'
import multi from './multi'
import standard from './standard'

let all = { cucumber, cucumberMulti, multi, standard }

function handlePath (parserPath) {
  try {
    parserPath = `${process.cwd()}/${parserPath}`;
    let customParserPath = require.resolve(parserPath)
    return require(customParserPath)
  } catch (e) {
    throw new Error(`Invalid Custom Parser Path Specified: ${parserPath}`)
  }
}

function handleFlakeParser (parserName) {
  if (all[parserName]) {
    return all[parserName]
  } else {
    throw new Error(`Invalid Parser Specified: ${parserName}`)
  }
}

function getParser (parser = '') {
  // Not exactly sure what this is for yet
  // if (parser.hasOwnProperty('parse')) {
  //   return handleObject(parser)
  // }
  if (extname(parser)) {
    return handlePath(parser)
  }

  return handleFlakeParser(parser)
}

export default { all, getParser }
