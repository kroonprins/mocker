import { ClassValidationService } from '@kroonprins/mocker-shared-lib/class-validation.service'
import { AppClassValidationService } from '@kroonprins/mocker-shared-lib/app-class-validation.service'
import { LearningModeDbValidationModel } from './learning-mode.db.validation-model'
import { LearningModeDbService } from './learning-mode.db.service'
import { LearningModeService } from './learning-mode.service'
import { config } from '@kroonprins/mocker-shared-lib/config'

const initialize = () => {
  config
    .registerInstance(LearningModeDbValidationModel, new LearningModeDbValidationModel())
    .registerInstance(ClassValidationService, new AppClassValidationService())
    .registerInstance(LearningModeDbService, new LearningModeDbService())
    .registerInstance(LearningModeService, new LearningModeService())
}

export {
  initialize
}
