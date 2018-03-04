#!/bin/sh
':' // ; exec "$(command -v nodejs || command -v node)" "--experimental-modules" "$0" "$@"

import { Mocker } from './lib/mocker'

try {
  (new Mocker()).startLearningModeReverseProxyServer()
    .catch(error => {
      console.error('Failed to start learning mode server: ', error.message)
    })
} catch (error) {
  console.error('Failed to start learning mode server: ', error.message)
}
