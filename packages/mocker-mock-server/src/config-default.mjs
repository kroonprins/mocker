
import { EchoServerService } from './echo-server.service'
import { NunjucksTemplatingHelpers } from './templating-helpers.nunjucks'
import { NunjucksTemplatingService } from './templating.service.nunjucks'
import { TemplatingService } from './templating.service'
import { SwaggerGenerationService } from './swagger-generation.service'
import { MockServerEventEmitter } from './mock-server.events'
import { MetricsService } from './metrics.service'
import { config } from '@kroonprins/mocker-shared-lib/config'

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
  registerInstance(EchoServerService, defaultOverride, () => new EchoServerService())
  registerInstance('NunjucksTemplatingHelpers', defaultOverride, () => new NunjucksTemplatingHelpers())
  registerInstance('NunjucksTemplatingService', defaultOverride, () => new NunjucksTemplatingService())
  registerInstance(TemplatingService, defaultOverride, () => new TemplatingService())
  registerInstance(SwaggerGenerationService, defaultOverride, () => new SwaggerGenerationService())
  registerInstance(MockServerEventEmitter, defaultOverride, () => new MockServerEventEmitter())
  registerInstance(MetricsService, defaultOverride, () => new MetricsService())
}

const initializeWithoutMetricsAndSwagger = (defaultOverride) => {
  registerInstance(EchoServerService, defaultOverride, () => new EchoServerService())
  registerInstance('NunjucksTemplatingHelpers', defaultOverride, () => new NunjucksTemplatingHelpers())
  registerInstance('NunjucksTemplatingService', defaultOverride, () => new NunjucksTemplatingService())
  registerInstance(TemplatingService, defaultOverride, () => new TemplatingService())
}

export {
  initialize,
  initializeWithoutMetricsAndSwagger
}
