class Server {
  constructor (port, bindAddress, status) {
    this.port = port
    this.bindAddress = bindAddress
    this.status = status
  }
}

class MockServer extends Server {}

class LearningModeServer extends Server {
  constructor (type, port, bindAddress, targetHost) {
    super(port, bindAddress)
    this.type = type
    this.targetHost = targetHost
  }
}

export {
  Server,
  MockServer,
  LearningModeServer
}
