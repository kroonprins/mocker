import chai from 'chai'
import { Server, ServerService, InMemoryServerStore } from '../../lib/server.service'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'

const expect = chai.expect

class TestServer extends Server {
  constructor (port, bindAddress) {
    super()
    this.port = port
    this.bindAddress = bindAddress
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

  const server1 = await serverService.retrieveServer(0)
  await serverService.restartServer(0)
  const restartedServer1 = await serverService.retrieveServer(0)
  expect(restartedServer1).to.equal(server1)
  expect(restartedServer1.status).to.equal('started')

  const server3 = await serverService.retrieveServer('myid')
  expect(server3.status).to.equal('started')
  expect(server3.port).to.equal(1234)
  const serverId3StartedAgain = await serverService.startNewServer('myid', TestServer, 1235, 'localhost')
  expect(serverId3StartedAgain).to.be.equal('myid')
  const server3StartedAgain = await serverService.retrieveServer('myid')
  expect(server3StartedAgain.status).to.equal('started')
  expect(server3StartedAgain.port).to.equal(1235)
}

export {
  test
}
