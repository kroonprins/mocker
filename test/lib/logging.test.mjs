import chai from 'chai'
import { logger } from './../../lib/logging'

const expect = chai.expect

expect(logger.getLevel()).to.equal('info')
