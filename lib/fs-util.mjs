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

class FileOperationQueue {
  // TODO:
  //   * can keep a queue per file location because no need to wait writing a file while another file in another location is being actioned
  //   * if queue length > 1 when starting to write, it actually doesn't make sense anymore to do the intermediate writes => queue could actually be a variable holding the last requested write (though should be careful that skipping operation doesn't result in error, e.g. write file + delete file => if write is skipped then delete would fail)
  constructor () {
    this.queue = []
    this.isExecuting = false
  }
  add (location, content) {
    return this._pushAndExecute(async () => {
      await overwriteFile(location, content)
    })
  }
  remove (location) {
    return this._pushAndExecute(async () => {
      await unlinkAsync(location)
    })
  }
  _pushAndExecute (action) {
    return new Promise((resolve, reject) => {
      try {
        this.queue.push(action)
        this._execute()
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  }
  async _execute () {
    if (this.queue.length === 0) {
      return
    }
    if (this.isExecuting) {
      return
    }
    this.isExecuting = true
    try {
      const action = this.queue.shift()
      await action()
    } finally {
      this.isExecuting = false
      this._execute()
    }
  }
}

export {
  readFileAsync,
  unlinkAsync,
  rimrafAsync,
  globAsync,
  overwriteFile,
  FileOperationQueue
}
