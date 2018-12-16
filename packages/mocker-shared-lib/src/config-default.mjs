import { ConfigService } from './config.service'
import { LatencyValidationModel } from './latency-validation-model'
import { RuleValidationModel } from './rule-validation-model'
import { ProjectValidationModel } from './project-validation-model'
import { ClassValidationService } from './class-validation.service'
import { AppClassValidationService } from './app-class-validation.service'
import { RuleService } from './rule.service'
import { ProjectStore, InMemoryProjectStore } from './project.store'
import { ProjectService } from './project.service'
import { Logger, PinoLogger } from './logging'
import { config } from './config'

const registerInstance = (id, overrideValues, defaultValueFactory) => {
  let value
  if (overrideValues && id in overrideValues) {
    value = overrideValues[id]
  } else {
    value = defaultValueFactory()
  }
  config.registerInstance(id, value)
}

const initialize = (defaultOverride) => {
  config
    .registerDefaultProperty('logging.level.startup', 'info')
    .registerType(Logger, PinoLogger)

  registerInstance(ConfigService, defaultOverride, () => new ConfigService())
  registerInstance(LatencyValidationModel, defaultOverride, () => new LatencyValidationModel())
  registerInstance(RuleValidationModel, defaultOverride, () => new RuleValidationModel())
  registerInstance(ProjectValidationModel, defaultOverride, () => new ProjectValidationModel())
  registerInstance(ClassValidationService, defaultOverride, () => new AppClassValidationService())
  registerInstance(RuleService, defaultOverride, () => new RuleService())
  registerInstance(ProjectStore, defaultOverride, () => new InMemoryProjectStore())
  registerInstance(ProjectService, defaultOverride, () => new ProjectService())
}

const initializeWithoutProjectService = (defaultOverride) => {
  config
    .registerDefaultProperty('logging.level.startup', 'info')
    .registerType(Logger, PinoLogger)

  registerInstance(ConfigService, defaultOverride, () => new ConfigService())
  registerInstance(LatencyValidationModel, defaultOverride, () => new LatencyValidationModel())
  registerInstance(RuleValidationModel, defaultOverride, () => new RuleValidationModel())
  registerInstance(ClassValidationService, defaultOverride, () => new AppClassValidationService())
  registerInstance(RuleService, defaultOverride, () => new RuleService())
}

export {
  initialize,
  initializeWithoutProjectService
}
