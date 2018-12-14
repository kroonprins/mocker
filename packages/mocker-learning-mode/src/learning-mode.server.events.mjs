import EventEmitter from 'events'

class LearningModeServerEventEmitter extends EventEmitter {}

const LearningModeServerEvents = Object.freeze({
  SERVER_STARTED: 'server-started',
  SERVER_STOPPED: 'server-stopped',
  REQUEST_RECEIVED: 'request-received'
})

export {
  LearningModeServerEventEmitter,
  LearningModeServerEvents
}
