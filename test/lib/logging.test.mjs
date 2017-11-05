import chai from 'chai'
import { logger } from './../../lib/logging'

const expect = chai.expect

const test = () => {
  expect(logger.getLevel()).to.equal('info')
}

export {
  test
}
