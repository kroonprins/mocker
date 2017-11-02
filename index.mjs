#!/bin/sh
":" //# comment; exec /usr/bin/env node --experimental-modules "$0" "$@"

import { logger } from './lib/logging';
import { MockServer } from './lib/mock-server';
import { AdministrationServer } from './lib/administration-server';
import { config } from './lib/config';

const mockServer = new MockServer(config.mockServerPort, config.project);
mockServer.start();

const administrationServer = new AdministrationServer(config.administrationServerPort);
administrationServer.start();