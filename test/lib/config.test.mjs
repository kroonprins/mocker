import chai from 'chai';
const expect = chai.expect;

import { config } from './../../lib/config';

expect(config.mockServerPort).to.equal(3000);
expect(config.administrationServerPort).to.equal(3001);
expect(config.project).to.equal("x");
expect(config.projectsFileLocation).to.equal("./projects/projects.yaml");
expect(config.startupLogLevel).to.equal("info");

config.projectsFileLocation = './test/projects/test.yaml';
expect(config.projectsFileLocation).to.equal("./test/projects/test.yaml");