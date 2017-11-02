import chai from 'chai';
const expect = chai.expect;

import { logger } from './../../lib/logging';

expect(logger.getLevel()).to.equal('info');