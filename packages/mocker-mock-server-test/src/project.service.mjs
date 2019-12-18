import serializr from 'serializr'
import { RuleService } from '@kroonprins/mocker-shared-lib/rule.service.mjs'
import { ProjectRule } from '@kroonprins/mocker-shared-lib/project-model.mjs'
import { RuleSerializationModel } from '@kroonprins/mocker-shared-lib/rule-serialization-model.mjs'
import { globAsync } from '@kroonprins/mocker-shared-lib/fs-util.mjs'
import { Logger } from '@kroonprins/mocker-shared-lib/logging.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'

const deserialize = serializr.deserialize

class ProjectService {
  constructor (projectRules) {
    this.logger = config.getClassInstance(Logger, { id: 'test-project-service' })
    this.projectRules = projectRules
  }

  static async fromRuleLocations (locations) {
    const projectRules = []
    for (const location of locations) {
      const ruleFiles = await globAsync(location)
      for (const ruleFile of ruleFiles) {
        const rule = await config.getInstance(RuleService).readRule(ruleFile)
        projectRules.push(new ProjectRule(location, rule))
      }
    } // more parallellization possible but not important
    return new ProjectService(Promise.all(projectRules))
  }

  static async fromRules (rules) {
    const projectRules = rules.map(rule => {
      try {
        const deserializedRule = deserialize(RuleSerializationModel, rule)
        return new ProjectRule(undefined, deserializedRule)
      } catch (e) {
        throw new Error('The rule seems to have an incorrect format: ' + JSON.stringify(rule), e)
      }
    })
    return new ProjectService(projectRules)
  }

  async listProjectRules () {
    return this.projectRules
  }

  async reInitialize () {
  }
}

export {
  ProjectService
}
