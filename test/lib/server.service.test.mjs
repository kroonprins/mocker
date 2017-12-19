import chai from 'chai'
import { Server, ServerService, InMemoryServerStore } from '../../lib/server.service'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'

const expect = chai.expect

class TestServer extends Server {
  constructor (port, bindAddress) {
    super()
    this.status = 'constructed'
  }

  start () {
    return new Promise(resolve => {
      this.status = 'started'
      resolve(this.status)
    }, reject => {
      this.status = 'start failed'
      reject(this.status)
    })
  }
  stop () {
    return new Promise(resolve => {
      this.status = 'stopped'
      resolve(this.status)
    }, reject => {
      this.status = 'stop failed'
      reject(this.status)
    })
  }
}

const test = async () => {
  config
    .registerProperty('logging.level.startup', 'debug')
    .registerType(Logger, PinoLogger)

  const serverService = new ServerService(new InMemoryServerStore())

  const serverId1 = await serverService.startNewServer(null, TestServer, 1234, 'localhost')
  expect(serverId1).to.be.equal(0)

  const serverId2 = await serverService.startNewServer(null, TestServer, 1234, 'localhost')
  expect(serverId2).to.be.equal(1)

  const serverId3 = await serverService.startNewServer('myid', TestServer, 1234, 'localhost')
  expect(serverId3).to.be.equal('myid')

  const server2 = await serverService.retrieveServer(1)
  expect(server2).is.instanceof(TestServer)
  expect(server2.status).to.be.equal('started')

  await serverService.stopServer(1)
  expect(server2.status).to.be.equal('stopped')
  expect(await serverService.retrieveServer(1)).to.equal(undefined)
}

export {
  test
}
