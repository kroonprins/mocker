import { config } from './config'
import { Logger, PinoLogger } from './logging'
import { ClassValidationService } from './class-validation.service'
import { AppClassValidationService } from './app-class-validation.service'
import { ProjectStore, InMemoryProjectStore } from './project-store'
import { RuleService } from './rule-service'
import { ProjectService } from './project-service'
import { ServerService } from './server.service'
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
      .registerProperty('mock-server.port', ENV.MOCKER_MOCK_SERVER_PORT || 3000)
      .registerProperty('mock-server.bind-address', ENV.MOCKER_MOCK_SERVER_BIND_ADDRESS || 'localhost')
      .registerProperty('administration-server.port', ENV.MOCKER_ADMINISTRATION_SERVER_PORT || 3001)
      .registerProperty('administration-server.bind-address', ENV.MOCKER_ADMINISTRATION_SERVER_BIND_ADDRESS || 'localhost')
      .registerProperty('learning-mode.reverse-proxy.port', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_PORT || 3002)
      .registerProperty('learning-mode.reverse-proxy.bind-address', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_BIND_ADDRESS || 'localhost')
      .registerProperty('learning-mode.reverse-proxy.target-host', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_TARGET_HOST || 'http://www.velo-antwerpen.be')
      .registerProperty('learning-mode.forward-proxy.port', ENV.MOCKER_LEARNING_MODE_FORWARD_PROXY_SERVER_PORT || 3003)
      .registerProperty('learning-mode.forward-proxy.bind-address', ENV.MOCKER_LEARNING_MODE_FORWARD_PROXY_SERVER_BIND_ADDRESS || 'localhost')
      .registerProperty('learning-mode.db.location', ENV.MOCKER_LEARNING_MODE_DB_LOCATION || './data/learning_mode.db')
      .registerProperty('api-server.port', ENV.MOCKER_API_SERVER_PORT || 3004)
      .registerProperty('api-server.bind-address', ENV.MOCKER_API_SERVER_BIND_ADDRESS || 'localhost')
      .registerProperty('ui-server.port', ENV.MOCKER_UI_SERVER_PORT || 3005)
      .registerProperty('ui-server.bind-address', ENV.MOCKER_UI_SERVER_BIND_ADDRESS || 'localhost')
      .registerProperty('ui-server.statics-location', ENV.MOCKER_UI_SERVER_STATICS_LOCATION || './ui/dist')
      .registerType(Logger, PinoLogger)
      .registerInstance(ClassValidationService, new AppClassValidationService())
      .registerInstance('NunjucksTemplatingHelpers', new NunjucksTemplatingHelpers())
      .registerInstance('NunjucksTemplatingService', new NunjucksTemplatingService())
      .registerInstance(TemplatingService, new TemplatingService())
      .registerInstance(RuleService, new RuleService())
      .registerInstance(ProjectStore, new InMemoryProjectStore())
      .registerInstance(ProjectService, new ProjectService())
      .registerInstance(LearningModeDbService, new LearningModeDbService())
      .registerInstance(LearningModeService, new LearningModeService())
      .registerInstance(ServerService, new ServerService())
      .registerInstance(MockServer, new MockServer())
      .registerInstance(AdministrationServer, new AdministrationServer())
      .registerInstance(LearningModeReverseProxyServer, new LearningModeReverseProxyServer())
      .registerInstance(ApiServer, new ApiServer())
      .registerInstance(UiServer, new UiServer())
  }

  start () {
    const mockServer = config.getInstance(MockServer)
    mockServer.start()

    const administrationServer = config.getInstance(AdministrationServer)
    administrationServer.start()

    const learningModeReverseProxyServer = config.getInstance(LearningModeReverseProxyServer)
    learningModeReverseProxyServer.start()

    const apiServer = config.getInstance(ApiServer)
    apiServer.start()

    const uiServer = config.getInstance(UiServer)
    uiServer.start()
  }
}

export {
  Mocker
}
