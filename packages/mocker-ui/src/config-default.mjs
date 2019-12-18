import { ClassValidationService } from '@kroonprins/mocker-shared-lib/class-validation.service.mjs'
import { AppClassValidationService } from '@kroonprins/mocker-shared-lib/app-class-validation.service.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { ServerValidationModel } from './server-validation-model.mjs'
import { ServerService, ServerStore, InMemoryServerStore } from './server.service.mjs'

const initialize = () => {
  config
    .registerInstance(ServerValidationModel, new ServerValidationModel())
    .registerInstance(ClassValidationService, new AppClassValidationService())
    .registerInstance(ServerStore, new InMemoryServerStore())
    .registerInstance(ServerService, new ServerService())
}

export {
  initialize
}
