import fs from 'fs'
import util from 'util'
import glob from 'glob'
import path from 'path'
import mkdirp from 'mkdirp'

const readFileAsync = util.promisify(fs.readFile)
const writeFileAsync = util.promisify(fs.writeFile)

const mkdirpAsync = util.promisify(mkdirp)

const globAsync = util.promisify(glob)

const overwriteFile = async (fileLocation, fileContent) => {
  const directory = path.dirname(fileLocation)
  await mkdirpAsync(directory)
  return writeFileAsync(fileLocation, fileContent)
}

export {
  readFileAsync,
  globAsync,
  overwriteFile
}
