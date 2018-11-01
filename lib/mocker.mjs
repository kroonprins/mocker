import { config } from './config'
import { Logger, PinoLogger } from './logging'
import { ConfigService } from './config.service'
import { ClassValidationService } from './class-validation.service'
import { AppClassValidationService } from './app-class-validation.service'
import { LatencyValidationModel } from './latency-validation-model'
import { RuleValidationModel } from './rule-validation-model'
import { ProjectValidationModel } from './project-validation-model'
import { LearningModeDbValidationModel } from './learning-mode.db.validation-model'
import { ServerValidationModel } from './server-validation-model'
import { ProjectStore, InMemoryProjectStore } from './project-store'
import { RuleService } from './rule-service'
import { ProjectService } from './project-service'
import { ServerService, ServerStore, InMemoryServerStore } from './server.service'
import { TemplatingService } from './templating-service'
import { NunjucksTemplatingHelpers } from './templating-helpers.nunjucks'
import { NunjucksTemplatingService } from './templating-service.nunjucks'
import { MockServer } from './mock-server'
import { AdministrationServer } from './administration-server'
import { LearningModeDbService } from './learning-mode.db.service'
import { LearningModeService } from './learning-mode.service'
import { LearningModeReverseProxyServer } from './learning-mode.reverse-proxy'
import { EchoServerService } from './echo-server.service'
import { ApiServer } from './api-server.mjs'
import { UiServer } from './ui-server.mjs'
import cjs from './mjs_workaround/cjs.js'
import dotenv from 'dotenv'

dotenv.config()
const ENV = process.env

class Mocker {
  constructor () {
    config
      .registerProperty('logging.level.startup', ENV.MOCKER_LOG_LEVEL || 'info')
      .registerType(Logger, PinoLogger)

    this.logger = config.getClassInstance(Logger, { id: 'mocker' })
    if (!ENV.MOCKER_PROJECTS_FILE) {
      this.logger.warn('The environment variable MOCKER_PROJECTS_FILE is not set. This should be used for demo purposes only.')
    }
    if (!ENV.MOCKER_LEARNING_MODE_DB_LOCATION) {
      this.logger.warn('The environment variable MOCKER_LEARNING_MODE_DB_LOCATION is not set. This should be used for demo purposes only.')
    }
    config
      .registerProperty('project', ENV.MOCKER_PROJECT)
      .registerProperty('project.location', ENV.MOCKER_PROJECTS_FILE || `${cjs.__dirname}/../projects/projects.yaml`)
      .registerProperty('rule.default.location', ENV.MOCKER_RULES_DEFAULT_LOCATION)
      .registerProperty('learning-mode.db.location', ENV.MOCKER_LEARNING_MODE_DB_LOCATION || `${cjs.__dirname}/../data/learning_mode.db`)
      .registerProperty('mock-server.watch-for-configuration-changes', ENV.MOCKER_MOCK_SERVER_WATCH_FOR_FILE_CHANGES === 'true' || false)
      .registerProperty('templating.helpers.nunjucks', ENV.TEMPLATING_HELPERS_NUNJUCKS)
      .registerInstance(EchoServerService, new EchoServerService())
      .registerInstance('NunjucksTemplatingHelpers', new NunjucksTemplatingHelpers())
      .registerInstance('NunjucksTemplatingService', new NunjucksTemplatingService())
      .registerInstance(TemplatingService, new TemplatingService())
      .registerInstance(ConfigService, new ConfigService())
      .registerInstance(LatencyValidationModel, new LatencyValidationModel())
      .registerInstance(RuleValidationModel, new RuleValidationModel())
      .registerInstance(ProjectValidationModel, new ProjectValidationModel())
      .registerInstance(LearningModeDbValidationModel, new LearningModeDbValidationModel())
      .registerInstance(ServerValidationModel, new ServerValidationModel())
      .registerInstance(ClassValidationService, new AppClassValidationService())
      .registerInstance(RuleService, new RuleService())
      .registerInstance(ProjectStore, new InMemoryProjectStore())
      .registerInstance(ProjectService, new ProjectService())
      .registerInstance(LearningModeDbService, new LearningModeDbService())
      .registerInstance(LearningModeService, new LearningModeService())
      .registerInstance(ServerStore, new InMemoryServerStore())
      .registerInstance(ServerService, new ServerService())
  }

  startUi () {
    config
      .registerProperty('administration-server.port', ENV.MOCKER_ADMINISTRATION_SERVER_PORT || 3001)
      .registerProperty('administration-server.bind-address', ENV.MOCKER_ADMINISTRATION_SERVER_BIND_ADDRESS || '0.0.0.0')
      .registerProperty('api-server.port', ENV.MOCKER_API_SERVER_PORT || 3004)
      .registerProperty('api-server.bind-address', ENV.MOCKER_API_SERVER_BIND_ADDRESS || '0.0.0.0')
      .registerProperty('ui-server.port', ENV.MOCKER_UI_SERVER_PORT || 3005)
      .registerProperty('ui-server.bind-address', ENV.MOCKER_UI_SERVER_BIND_ADDRESS || '0.0.0.0')
      .registerProperty('ui-server.statics-location', ENV.MOCKER_UI_SERVER_STATICS_LOCATION || `${cjs.__dirname}/../ui/dist`)
      .registerInstance(AdministrationServer, new AdministrationServer())
      .registerInstance(ApiServer, new ApiServer())
      .registerInstance(UiServer, new UiServer())

    const administrationServer = config.getInstance(AdministrationServer)
    const startedAdministrationServer = administrationServer.start()

    const apiServer = config.getInstance(ApiServer)
    const startedApiServer = apiServer.start()

    const uiServer = config.getInstance(UiServer)
    const startedUiServer = uiServer.start()

    return Promise.all([
      startedAdministrationServer,
      startedApiServer,
      startedUiServer
    ])
  }

  startMockServer () {
    if (!config.getProperty('project')) {
      throw new Error('The project must be set when starting the mock server (environment variable MOCKER_PROJECT)')
    }
    config
      .registerProperty('mock-server.port', ENV.MOCKER_MOCK_SERVER_PORT || 3000)
      .registerProperty('mock-server.bind-address', ENV.MOCKER_MOCK_SERVER_BIND_ADDRESS || '0.0.0.0')
      .registerInstance(MockServer, new MockServer())

    const mockServer = config.getInstance(MockServer)
    return mockServer.start()
  }

  startLearningModeReverseProxyServer () {
    if (!config.getProperty('project')) {
      throw new Error('The project must be set when starting the learning mode reverse proxy server (environment variable MOCKER_PROJECT)')
    }
    if (!ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_TARGET_HOST) {
      throw new Error('A target for the reverse proxy must be defined by setting environment variable MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_TARGET_HOST')
    }
    config
      .registerProperty('learning-mode.reverse-proxy.port', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_PORT || 3002)
      .registerProperty('learning-mode.reverse-proxy.bind-address', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_BIND_ADDRESS || '0.0.0.0')
      .registerProperty('learning-mode.reverse-proxy.target-host', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_TARGET_HOST)
      .registerInstance(LearningModeReverseProxyServer, new LearningModeReverseProxyServer())

    const learningModeReverseProxyServer = config.getInstance(LearningModeReverseProxyServer)
    return learningModeReverseProxyServer.start()
  }

  startLearningModeForwardProxyServer () {
    if (!config.getProperty('project')) {
      throw new Error('The project must be set when starting the learning mode forward proxy server (environment variable MOCKER_PROJECT)')
    }
    config
      .registerProperty('learning-mode.forward-proxy.port', ENV.MOCKER_LEARNING_MODE_FORWARD_PROXY_SERVER_PORT || 3003)
      .registerProperty('learning-mode.forward-proxy.bind-address', ENV.MOCKER_LEARNING_MODE_FORWARD_PROXY_SERVER_BIND_ADDRESS || '0.0.0.0')
  }
}

export {
  Mocker
}
