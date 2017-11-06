import fs from 'fs'
import util from 'util'
import glob from 'glob'
import path from 'path'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'

const readFileAsync = util.promisify(fs.readFile)
const writeFileAsync = util.promisify(fs.writeFile)
const unlinkAsync = util.promisify(fs.unlink)
const rimrafAsync = util.promisify(rimraf)
const mkdirpAsync = util.promisify(mkdirp)

const globAsync = util.promisify(glob)

const overwriteFile = async (fileLocation, fileContent) => {
  const directory = path.dirname(fileLocation)
  await mkdirpAsync(directory)
  return writeFileAsync(fileLocation, fileContent)
}

export {
  readFileAsync,
  unlinkAsync,
  rimrafAsync,
  globAsync,
  overwriteFile
}
