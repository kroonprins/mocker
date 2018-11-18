#!/usr/bin/env sh
':' // ; exec "$(command -v nodejs || command -v node)" "--experimental-modules" "$0" "$@"

import { Mocker } from './lib/mocker'

try {
  (new Mocker()).startMockServer()
    .catch(error => {
      console.error('Failed to start mock server: ', error.stack)
    })
} catch (error) {
  console.error('Failed to start mock server: ', error.stack)
}
