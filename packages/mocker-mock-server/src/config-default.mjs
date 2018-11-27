
import { SwaggerGenerationService } from './swagger-generation.service'
import { config } from '@kroonprins/mocker-shared-lib/config'

const initialize = () => {
  config
    .registerInstance(SwaggerGenerationService, new SwaggerGenerationService())
}

export {
  initialize
}
