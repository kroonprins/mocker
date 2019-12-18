import { ConfigService } from './config.service.mjs'
import { LatencyValidationModel } from './latency-validation-model.mjs'
import { RuleValidationModel } from './rule-validation-model.mjs'
import { ProjectValidationModel } from './project-validation-model.mjs'
import { ClassValidationService } from './class-validation.service.mjs'
import { AppClassValidationService } from './app-class-validation.service.mjs'
import { RuleService } from './rule.service.mjs'
import { ProjectStore, InMemoryProjectStore } from './project.store.mjs'
import { ProjectService } from './project.service.mjs'
import { Logger, PinoLogger } from './logging.mjs'
import { config } from './config.mjs'

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
