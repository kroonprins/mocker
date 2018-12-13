import EventEmitter from 'events'

class MockServerEventEmitter extends EventEmitter {}

const MockServerEvents = Object.freeze({
  SERVER_STARTED: 'server-started',
  SERVER_STOPPED: 'server-stopped',
  REQUEST_RECEIVED: 'request-received'
})

export {
  MockServerEventEmitter,
  MockServerEvents
}
