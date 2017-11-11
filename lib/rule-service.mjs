import yaml from 'js-yaml'

import { RuleSerializationModel } from './rule-serialization-model'
import { deserialize } from './mjs_workaround/serializr-es6-module-loader'
import { readFileAsync } from './fs-util'
import { Logger } from './logging'
import { config } from './config'

class RuleService {
  constructor () {
    this.logger = config.getClassInstance(Logger, { id: 'rule-service' })
  }
  async readRule (fileName, encoding = 'utf8') {
    this.logger.debug('Read rule %s with encoding %s', fileName, encoding)
    const fileContent = await readFileAsync(fileName, encoding)
    this.logger.debug(fileContent, 'Rule file content for %s', fileName)
    const rule = yaml.safeLoad(fileContent)
    try {
      return deserialize(RuleSerializationModel, rule)
    } catch (e) {
      this.logger.error(e, `Could not parse rule for file ${fileName}`)
      throw new Error(`The rule ${fileName} seems to have an incorrect format`)
    }
  }
}

export {
  RuleService
}
