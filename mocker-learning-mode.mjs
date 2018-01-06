#!/bin/sh
':' // ; exec "$(command -v nodejs || command -v node)" "--experimental-modules" "$0" "$@"

import { Mocker } from './lib/mocker'

(new Mocker()).startLearningModeReverseProxyServer()
  .catch(error => {
    console.error('Failed to start learning mode server', error)
  })
