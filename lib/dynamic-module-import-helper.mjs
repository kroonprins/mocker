import path from 'path'
import normalize from 'normalize-path'

const createModulePath = (absolutePath, workingLocation) => {
  return './' + normalize(path.relative(workingLocation, absolutePath))
}

export {
  createModulePath
}
