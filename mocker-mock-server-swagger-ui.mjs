#!/usr/bin/env sh
':' // ; exec "$(command -v nodejs || command -v node)" "--experimental-modules" "$0" "$@"

import { Mocker } from './lib/mocker'

try {
  (new Mocker()).startMockServerSwaggerUi()
    .catch(error => {
      console.error('Failed to start mocker server swagger ui: ', error.message)
    })
} catch (error) {
  console.error('Failed to start mock server swagger ui: ', error.message)
}
