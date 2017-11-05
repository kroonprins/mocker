import chai from 'chai'
import { config } from './../../lib/config'

const expect = chai.expect

const test = () => {
  expect(config.mockServerPort).to.equal(3000)
  expect(config.administrationServerPort).to.equal(3001)
  expect(config.learningModeReverseProxyServerPort).to.equal(3002)
  expect(config.learningModeForwardProxyServerPort).to.equal(3003)
  expect(config.project).to.equal('x')
  expect(config.projectsFileLocation).to.equal('./projects/projects.yaml')
  expect(config.startupLogLevel).to.equal('info')
  expect(config.learningModeDb).to.equal('./test/tmp/test.db')

  config.projectsFileLocation = './test/projects/tests.yaml'
  expect(config.projectsFileLocation).to.equal('./test/projects/tests.yaml')
}

export {
  test
}
