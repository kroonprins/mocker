import { config } from './config'
import { Logger, PinoLogger } from './logging'
import { ConfigService } from './config.service'
import { ClassValidationService } from './class-validation.service'
import { AppClassValidationService } from './app-class-validation.service'
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
import { ApiServer } from './api-server.mjs'
import { UiServer } from './ui-server.mjs'

const ENV = process.env

class Mocker {
  constructor () {
    config
      .registerProperty('project', ENV.MOCKER_PROJECT || 'Wow, even more amazing!!')
      .registerProperty('logging.level.startup', ENV.MOCKER_LOG_LEVEL || 'info')
      .registerProperty('project.location', ENV.MOCKER_PROJECTS_FILE || './projects/projects.yaml')
      .registerProperty('rule.default.location', ENV.MOCKER_RULES_DEFAULT_LOCATION || './rules')
      .registerProperty('learning-mode.db.location', ENV.MOCKER_LEARNING_MODE_DB_LOCATION || './data/learning_mode.db')
      .registerType(Logger, PinoLogger)
      .registerInstance('NunjucksTemplatingHelpers', new NunjucksTemplatingHelpers())
      .registerInstance('NunjucksTemplatingService', new NunjucksTemplatingService())
      .registerInstance(TemplatingService, new TemplatingService())
      .registerInstance(ConfigService, new ConfigService())
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
      .registerProperty('administration-server.bind-address', ENV.MOCKER_ADMINISTRATION_SERVER_BIND_ADDRESS || 'localhost')
      .registerProperty('api-server.port', ENV.MOCKER_API_SERVER_PORT || 3004)
      .registerProperty('api-server.bind-address', ENV.MOCKER_API_SERVER_BIND_ADDRESS || 'localhost')
      .registerProperty('ui-server.port', ENV.MOCKER_UI_SERVER_PORT || 3005)
      .registerProperty('ui-server.bind-address', ENV.MOCKER_UI_SERVER_BIND_ADDRESS || 'localhost')
      .registerProperty('ui-server.statics-location', ENV.MOCKER_UI_SERVER_STATICS_LOCATION || './ui/dist')
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
    config
      .registerProperty('mock-server.port', ENV.MOCKER_MOCK_SERVER_PORT || 3000)
      .registerProperty('mock-server.bind-address', ENV.MOCKER_MOCK_SERVER_BIND_ADDRESS || 'localhost')
      .registerInstance(MockServer, new MockServer())

    const mockServer = config.getInstance(MockServer)
    return mockServer.start()
  }

  startLearningModeReverseProxyServer () {
    config
      .registerProperty('learning-mode.reverse-proxy.port', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_PORT || 3002)
      .registerProperty('learning-mode.reverse-proxy.bind-address', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_BIND_ADDRESS || 'localhost')
      .registerProperty('learning-mode.reverse-proxy.target-host', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_TARGET_HOST || 'http://www.velo-antwerpen.be')
      .registerInstance(LearningModeReverseProxyServer, new LearningModeReverseProxyServer())

    const learningModeReverseProxyServer = config.getInstance(LearningModeReverseProxyServer)
    return learningModeReverseProxyServer.start()
  }

  startLearningModeForwardProxyServer () {
    config
      .registerProperty('learning-mode.forward-proxy.port', ENV.MOCKER_LEARNING_MODE_FORWARD_PROXY_SERVER_PORT || 3003)
      .registerProperty('learning-mode.forward-proxy.bind-address', ENV.MOCKER_LEARNING_MODE_FORWARD_PROXY_SERVER_BIND_ADDRESS || 'localhost')
  }
}

export {
  Mocker
}
