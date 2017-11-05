#!/bin/sh
':' // # comment; exec /usr/bin/env node --experimental-modules "$0" "$@" // eslint-disable-line

import { MockServer } from './lib/mock-server'
import { AdministrationServer } from './lib/administration-server'
import { LearningModeReverseProxyServer } from './lib/learning-mode.reverse-proxy'
// import { LearningModeForwardProxyServer } from './lib/learning-mode.forward-proxy'
import { config } from './lib/config'

const mockServer = new MockServer(config.mockServerPort, config.project)
mockServer.start()

const administrationServer = new AdministrationServer(config.administrationServerPort)
administrationServer.start()

const learningModeReverseProxyServer = new LearningModeReverseProxyServer(config.learningModeReverseProxyServerPort, 'http://www.google.be', config.project)
learningModeReverseProxyServer.start()

// const learningModeForwardProxyServer = new LearningModeForwardProxyServer(config.learningModeForwardProxyServerPort, 'http://www.velo-antwerpen.be', config.project);
// learningModeForwardProxyServer.start();
