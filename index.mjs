import { logger } from './lib/logging';
import { MockServer } from './lib/mock-server';
import { AdministrationServer } from './lib/administration-server';

const mockServer = new MockServer(3000, "Wow, even more amazing!!");
mockServer.start();

const administrationServer = new AdministrationServer(3001);
administrationServer.start();