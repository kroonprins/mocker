#!/usr/bin/env sh
':' // ; exec "$(command -v nodejs || command -v node)" "--experimental-modules" "$0" "$@"

import { Mocker } from './lib/mocker'

(new Mocker()).startUi()
  .catch(error => {
    console.error('Failed to start required components', error)
  })
