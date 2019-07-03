#!/usr/bin/env sh
':' // ; exec "$(command -v nodejs || command -v node)" "--experimental-modules" "--es-module-specifier-resolution=node" "$0" "$@"

import dotenv from 'dotenv'
import { LearningModeReverseProxyServer } from './src/learning-mode.reverse-proxy'
import { config } from '@kroonprins/mocker-shared-lib/config'
import { initialize as setDefaultConfig } from '@kroonprins/mocker-shared-lib/config-default'
import { initialize as setDefaultConfigLearningMode } from './src/config-default'
import { AdministrationServer } from './src/administration-server'

dotenv.config()
const ENV = process.env

if (!ENV.MOCKER_PROJECT) {
  throw new Error('The project must be set when starting the mock server (environment variable MOCKER_PROJECT)')
}
if (!ENV.MOCKER_LEARNING_MODE_DB_LOCATION) {
  throw new Error('The environment variable MOCKER_LEARNING_MODE_DB_LOCATION is not set. This should be used for demo purposes only.')
}
if (!ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_TARGET_HOST) {
  throw new Error('A target for the reverse proxy must be defined by setting environment variable MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_TARGET_HOST')
}

config
  .registerProperty('logging.level.startup', ENV.MOCKER_LOG_LEVEL || 'info')
  .registerProperty('project', ENV.MOCKER_PROJECT)
  .registerProperty('project.location', ENV.MOCKER_PROJECTS_FILE || './projects/projects.yaml')
  .registerProperty('rule.default.location', ENV.MOCKER_RULES_DEFAULT_LOCATION)
  .registerProperty('learning-mode.db.location', ENV.MOCKER_LEARNING_MODE_DB_LOCATION || `./data/learning_mode.db`)
  .registerProperty('learning-mode.reverse-proxy.port', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_PORT || 3002)
  .registerProperty('learning-mode.reverse-proxy.bind-address', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_BIND_ADDRESS || '0.0.0.0')
  .registerProperty('learning-mode.reverse-proxy.target-host', ENV.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_TARGET_HOST)
  .registerProperty('administration-server.port', ENV.MOCKER_LEARNING_MODE_SERVER_ADMINISTRATION_SERVER_PORT || 3008)
  .registerProperty('administration-server.bind-address', ENV.MOCKER_LEARNING_MODE_SERVER_ADMINISTRATION_SERVER_BIND_ADDRESS || '0.0.0.0')

setDefaultConfig()
setDefaultConfigLearningMode()

new AdministrationServer().start()
new LearningModeReverseProxyServer().start()

process.on('unhandledRejection', error => {
  console.error(error)
  process.exit(1)
})
