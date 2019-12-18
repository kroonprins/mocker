
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { EchoServerService } from './echo-server.service.mjs'
import { NunjucksTemplatingHelpers } from './templating-helpers.nunjucks.mjs'
import { NunjucksTemplatingService } from './templating.service.nunjucks.mjs'
import { TemplatingService } from './templating.service.mjs'
import { SwaggerGenerationService } from './swagger-generation.service.mjs'
import { MockServerEventEmitter } from './mock-server.events.mjs'
import { MetricsService } from './metrics.service.mjs'

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
