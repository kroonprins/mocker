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

const initialize = () => {
  config
    .registerDefaultProperty('logging.level.startup', 'info')
    .registerType(Logger, PinoLogger)
    .registerInstance(ConfigService, new ConfigService())
    .registerInstance(LatencyValidationModel, new LatencyValidationModel())
    .registerInstance(RuleValidationModel, new RuleValidationModel())
    .registerInstance(ProjectValidationModel, new ProjectValidationModel())
    .registerInstance(ClassValidationService, new AppClassValidationService())
    .registerInstance(RuleService, new RuleService())
    .registerInstance(ProjectStore, new InMemoryProjectStore())
    .registerInstance(ProjectService, new ProjectService())
}

export {
  initialize
}
