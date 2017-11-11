#!/bin/sh
':' // # comment; exec /usr/bin/env node --experimental-modules "$0" "$@" // eslint-disable-line

import { config } from './lib/config'
import { Logger, PinoLogger } from './lib/logging'
import { ProjectStore, InMemoryProjectStore } from './lib/project-store'
import { RuleService } from './lib/rule-service'
import { ProjectService } from './lib/project-service'
import { TemplatingService } from './lib/templating-service'
import { NunjucksTemplatingService } from './lib/templating-service.nunjucks'
import { MockServer } from './lib/mock-server'
import { AdministrationServer } from './lib/administration-server'
import { LearningModeDbService } from './lib/learning-mode.db.service'
import { LearningModeService } from './lib/learning-mode.service'
import { LearningModeReverseProxyServer } from './lib/learning-mode.reverse-proxy'

const ENV = process.env

config.registerProperty('project', 'Wow, even more amazing!!')
config.registerProperty('logging.level.startup', ENV.MOCKER_LOG_LEVEL || 'info')
config.registerProperty('project.default.location', ENV.MOCKER_PROJECTS_FILE || './projects/projects.yaml')
config.registerProperty('mock-server.port', ENV.MOCKER_MOCK_SERVER_PORT || 3000)
config.registerProperty('mock-server.bind-address', ENV.MOCKER_MOCK_SERVER_BIND_ADDRESS || 'localhost')
config.registerProperty('administration-server.port', ENV.MOCKER_ADMINISTRATION_SERVER_PORT || 3001)
config.registerProperty('administration-server.bind-address', ENV.MOCKER_ADMINISTRATION_SERVER_BIND_ADDRESS || 'localhost')
config.registerProperty('learning-mode.reverse-proxy.port', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_PORT || 3002)
config.registerProperty('learning-mode.reverse-proxy.bind-address', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_BIND_ADDRESS || 'localhost')
config.registerProperty('learning-mode.reverse-proxy.target-host', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_TARGET_HOST || 'http://www.velo-antwerpen.be')
config.registerProperty('learning-mode.forward-proxy.port', ENV.MOCKER_LEARNING_MODE_FORWARD_PROXY_SERVER_PORT || 3003)
config.registerProperty('learning-mode.forward-proxy.bind-address', ENV.MOCKER_LEARNING_MODE_FORWARD_PROXY_SERVER_BIND_ADDRESS || 'localhost')
config.registerProperty('learning-mode.db.location', ENV.MOCKER_LEARNING_MODE_DB_LOCATION || './data/learning_mode.db')
config.registerProperty('api-server.port', ENV.MOCKER_API_SERVER_PORT || 3004)
config.registerProperty('api-server.bind-address', ENV.MOCKER_API_SERVER_BIND_ADDRESS || 'localhost')

config.registerType(Logger, PinoLogger)
config.registerInstance('NunjucksTemplatingService', new NunjucksTemplatingService())

config.registerInstance(TemplatingService, new TemplatingService())
config.registerInstance(RuleService, new RuleService())
config.registerInstance(ProjectStore, new InMemoryProjectStore())
config.registerInstance(ProjectService, new ProjectService())
config.registerInstance(LearningModeDbService, new LearningModeDbService())
config.registerInstance(LearningModeService, new LearningModeService())
config.registerInstance(MockServer, new MockServer())
config.registerInstance(AdministrationServer, new AdministrationServer())
config.registerInstance(LearningModeReverseProxyServer, new LearningModeReverseProxyServer())

const mockServer = config.getInstance(MockServer)
mockServer.start()

const administrationServer = config.getInstance(AdministrationServer)
administrationServer.start()

const learningModeReverseProxyServer = config.getInstance(LearningModeReverseProxyServer)
learningModeReverseProxyServer.start()
