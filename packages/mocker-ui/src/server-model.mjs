import { Server } from '@kroonprins/mocker-shared-lib/server-model'

class MockServer extends Server {}

class LearningModeServer extends Server {
  constructor (type, port, bindAddress, targetHost) {
    super(port, bindAddress)
    this.type = type
    this.targetHost = targetHost
  }
}

export {
  MockServer,
  LearningModeServer
}
