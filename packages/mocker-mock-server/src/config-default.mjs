
import { EchoServerService } from './echo-server.service'
import { NunjucksTemplatingHelpers } from './templating-helpers.nunjucks'
import { NunjucksTemplatingService } from './templating.service.nunjucks'
import { TemplatingService } from './templating.service'
import { SwaggerGenerationService } from './swagger-generation.service'
import { MockServerEventEmitter } from './mock-server.events'
import { MetricsService } from './metrics.service'
import { config } from '@kroonprins/mocker-shared-lib/config'

const initialize = () => {
  config
    .registerInstance(EchoServerService, new EchoServerService())
    .registerInstance('NunjucksTemplatingHelpers', new NunjucksTemplatingHelpers())
    .registerInstance('NunjucksTemplatingService', new NunjucksTemplatingService())
    .registerInstance(TemplatingService, new TemplatingService())
    .registerInstance(SwaggerGenerationService, new SwaggerGenerationService())
    .registerInstance(MockServerEventEmitter, new MockServerEventEmitter())
    .registerInstance(MetricsService, new MetricsService())
}

export {
  initialize
}
