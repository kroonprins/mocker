import { ClassValidationService } from '@kroonprins/mocker-shared-lib/class-validation.service'
import { AppClassValidationService } from '@kroonprins/mocker-shared-lib/app-class-validation.service'
import { ServerValidationModel } from './server-validation-model'
import { ServerService, ServerStore, InMemoryServerStore } from './server.service'
import { config } from '@kroonprins/mocker-shared-lib/config'

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
