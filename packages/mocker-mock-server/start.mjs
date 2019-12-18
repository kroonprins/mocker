#!/usr/bin/env node

import dotenv from 'dotenv'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { initialize as setDefaultConfig } from '@kroonprins/mocker-shared-lib/config-default.mjs'
import { MockServer } from './src/mock-server.mjs'
import { initialize as setDefaultConfigMockServer } from './src/config-default.mjs'
import { AdministrationServer } from './src/administration-server.mjs'

dotenv.config()
const ENV = process.env

if (!ENV.MOCKER_PROJECT) {
  throw new Error('The project must be set when starting the mock server (environment variable MOCKER_PROJECT)')
}

config
  .registerProperty('logging.level.startup', ENV.MOCKER_LOG_LEVEL || 'info')
  .registerProperty('project', ENV.MOCKER_PROJECT)
  .registerProperty('project.location', ENV.MOCKER_PROJECTS_FILE || './projects/projects.yaml')
  .registerProperty('rule.default.location', ENV.MOCKER_RULES_DEFAULT_LOCATION)
  .registerProperty('mock-server.watch-for-configuration-changes', ENV.MOCKER_MOCK_SERVER_WATCH_FOR_FILE_CHANGES === 'true' || false)
  .registerProperty('templating.helpers.nunjucks', ENV.TEMPLATING_HELPERS_NUNJUCKS)
  .registerProperty('mock-server.port', ENV.MOCKER_MOCK_SERVER_PORT || 3000)
  .registerProperty('mock-server.bind-address', ENV.MOCKER_MOCK_SERVER_BIND_ADDRESS || '0.0.0.0')
  .registerProperty('mock-server-swagger-ui.enabled', ENV.MOCKER_MOCK_SERVER_SWAGGER_UI_ENABLED === 'true' || false)
  .registerProperty('mock-server-swagger-ui.port', ENV.MOCKER_MOCK_SERVER_SWAGGER_UI_PORT || 3006)
  .registerProperty('mock-server-swagger-ui.bind-address', ENV.MOCKER_MOCK_SERVER_SWAGGER_UI_BIND_ADDRESS || '0.0.0.0')
  .registerProperty('administration-server.port', ENV.MOCKER_MOCK_SERVER_ADMINISTRATION_SERVER_PORT || 3007)
  .registerProperty('administration-server.bind-address', ENV.MOCKER_MOCK_SERVER_ADMINISTRATION_SERVER_BIND_ADDRESS || '0.0.0.0')

setDefaultConfig()
setDefaultConfigMockServer()

new AdministrationServer().start()
new MockServer().start()

process.on('unhandledRejection', error => {
  console.error(error)
  process.exit(1)
})
