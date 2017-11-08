import yaml from 'js-yaml'

import { RuleSerializationModel } from './rule-serialization-model'
import { deserialize } from './mjs_workaround/serializr-es6-module-loader'
import { readFileAsync } from './fs-util'
import { logger } from './logging'

const RuleService = {
  readRule: async (fileName, encoding = 'utf8') => {
    logger.debug('Read rule %s with encoding %s', fileName, encoding)
    const fileContent = await readFileAsync(fileName, encoding)
    logger.debug(fileContent, 'Rule file content for %s', fileName)
    const rule = yaml.safeLoad(fileContent)
    try {
      return deserialize(RuleSerializationModel, rule)
    } catch (e) {
      logger.error(e, `Could not parse rule for file ${fileName}`)
      throw new Error(`The rule ${fileName} seems to have an incorrect format`)
    }
  }
}

export {
  RuleService
}
