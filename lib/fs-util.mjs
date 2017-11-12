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

/**
 * Overwrite a file in given fileLocation with given fileContent.
 * If the directory of the location does not exist, it is created.
 * If the file does not exist in the given location then it is created.
 *
 * @param {string} fileLocation full path of the file to (over)write.
 * @param {string} fileContent content to write in the file.
 * @returns a promise that resolves when the file is written.
 */
const overwriteFile = async (fileLocation, fileContent) => {
  const directory = path.dirname(fileLocation)
  await mkdirpAsync(directory)
  return writeFileAsync(fileLocation, fileContent)
}

/**
 * A queue in which file operations can be posted.
 * The queue ensures that operations on the same file are not executed concurrently avoiding possible corrupted files.
 */
class FileOperationQueue {
  // TODO:
  //   * can keep a queue per file location because no need to wait writing a file while another file in another location is being actioned
  //   * if queue length > 1 when starting to write, it actually doesn't make sense anymore to do the intermediate writes => queue could actually be a variable holding the last requested write (though should be careful that skipping operation doesn't result in error, e.g. write file + delete file => if write is skipped then delete would fail)
  constructor () {
    this.queue = []
    this.isExecuting = false
  }

  /**
   * Post operation on the queue to (over)write a file.
   *
   * @param {any} location location of the file to (over)write.
   * @param {any} content content to write to the file.
   * @returns A promise that resolves when the action has been added on the queue (not when it is executed).
   * @memberof FileOperationQueue
   */
  add (location, content) {
    return this._pushAndExecute(async () => {
      await overwriteFile(location, content)
    })
  }

  /**
   * Post operation on the queue to delete a file.
   *
   * @param {any} location location of the file to delete.
   * @returns A promise that resolves when the action has been added on the queue (not when it is executed).
   * @memberof FileOperationQueue
   */
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
