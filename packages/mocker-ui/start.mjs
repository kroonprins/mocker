#!/usr/bin/env node

import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initialize as setDefaultConfigMockServer } from '@kroonprins/mocker-mock-server'
import { initialize as setDefaultConfigLearningMode } from '@kroonprins/mocker-learning-mode'
import { AdministrationServer } from '@kroonprins/mocker-shared-lib/administration-server.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { initialize as setDefaultConfig } from '@kroonprins/mocker-shared-lib/config-default.mjs'
import { ApiServer } from './src/api-server.mjs'
import { UiServer } from './src/ui-server.mjs'
import { initialize as setDefaultConfigUI } from './src/config-default.mjs'

dotenv.config()
const ENV = process.env

config
  .registerProperty('logging.level.startup', ENV.MOCKER_LOG_LEVEL || 'info')
  .registerProperty('project', ENV.MOCKER_PROJECT)
  .registerProperty('project.location', ENV.MOCKER_PROJECTS_FILE || './projects/projects.yaml')
  .registerProperty('rule.default.location', ENV.MOCKER_RULES_DEFAULT_LOCATION)
  .registerProperty('learning-mode.db.location', ENV.MOCKER_LEARNING_MODE_DB_LOCATION || './data/learning_mode.db')
  .registerProperty('mock-server.watch-for-configuration-changes', ENV.MOCKER_MOCK_SERVER_WATCH_FOR_FILE_CHANGES === 'true' || false)
  .registerProperty('templating.helpers.nunjucks', ENV.TEMPLATING_HELPERS_NUNJUCKS)
  .registerProperty('administration-server.port', ENV.MOCKER_ADMINISTRATION_SERVER_PORT || 3001)
  .registerProperty('administration-server.bind-address', ENV.MOCKER_ADMINISTRATION_SERVER_BIND_ADDRESS || '0.0.0.0')
  .registerProperty('api-server.port', ENV.MOCKER_API_SERVER_PORT || 3004)
  .registerProperty('api-server.bind-address', ENV.MOCKER_API_SERVER_BIND_ADDRESS || '0.0.0.0')
  .registerProperty('ui-server.port', ENV.MOCKER_UI_SERVER_PORT || 3005)
  .registerProperty('ui-server.bind-address', ENV.MOCKER_UI_SERVER_BIND_ADDRESS || '0.0.0.0')
  .registerProperty('ui-server.statics-location', ENV.MOCKER_UI_SERVER_STATICS_LOCATION || `${dirname(fileURLToPath(import.meta.url))}/src/angular/dist/mocker-angular-ui`)

setDefaultConfig()
setDefaultConfigMockServer()
setDefaultConfigLearningMode()
setDefaultConfigUI()

config
  .registerInstance(AdministrationServer, new AdministrationServer())
  .registerInstance(ApiServer, new ApiServer())
  .registerInstance(UiServer, new UiServer())

config.getInstance(AdministrationServer).start()
config.getInstance(ApiServer).start()
config.getInstance(UiServer).start()

process.on('unhandledRejection', error => {
  console.error(error)
  process.exit(1)
})
