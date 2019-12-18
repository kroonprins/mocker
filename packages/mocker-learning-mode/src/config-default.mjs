import { ClassValidationService } from '@kroonprins/mocker-shared-lib/class-validation.service.mjs'
import { AppClassValidationService } from '@kroonprins/mocker-shared-lib/app-class-validation.service.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { LearningModeDbValidationModel } from './learning-mode.db.validation-model.mjs'
import { LearningModeDbService } from './learning-mode.db.service.mjs'
import { LearningModeService } from './learning-mode.service.mjs'
import { LearningModeServerEventEmitter } from './learning-mode.server.events.mjs'
import { MetricsService } from './metrics.service.mjs'

const initialize = () => {
  config
    .registerInstance(LearningModeDbValidationModel, new LearningModeDbValidationModel())
    .registerInstance(ClassValidationService, new AppClassValidationService())
    .registerInstance(LearningModeDbService, new LearningModeDbService())
    .registerInstance(LearningModeService, new LearningModeService())
    .registerInstance(LearningModeServerEventEmitter, new LearningModeServerEventEmitter())
    .registerInstance(MetricsService, new MetricsService())
}

export {
  initialize
}
