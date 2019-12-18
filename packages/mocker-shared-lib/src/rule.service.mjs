import yaml from 'js-yaml'
import serializr from 'serializr'
import { RuleSerializationModel } from './rule-serialization-model.mjs'
import { readFileAsync } from './fs-util.mjs'
import { Logger } from './logging.mjs'
import { config } from './config.mjs'

const deserialize = serializr.deserialize

class RuleService {
  constructor () {
    this.logger = config.getClassInstance(Logger, { id: 'rule-service' })
  }
  async readRule (fileName, encoding = 'utf8') {
    this.logger.debug('Read rule %s with encoding %s', fileName, encoding)
    const fileContent = await readFileAsync(fileName, encoding)
    this.logger.debug(fileContent, 'Rule file content for %s', fileName)
    try {
      const rule = yaml.safeLoad(fileContent)
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
