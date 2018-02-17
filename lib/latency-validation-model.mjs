import { ValidationModel } from './app-class-validation.service'
import { FixedLatency, RandomLatency } from './latency-model'

class LatencyValidationModel extends ValidationModel {
  constructor () {
    super()
    this[FixedLatency] = {
      '$id': 'uri://mocker/latency/FixedLatencyValidationModel',
      'FixedLatency': {
        'type': 'object',
        'properties': {
          'value': {
            'type': 'number',
            'minimum': 0
          }
        },
        'required': [
          'value'
        ],
        'additionalProperties': false
      },
      '$ref': '#/FixedLatency'
    }

    this[RandomLatency] = {
      '$id': 'uri://mocker/latency/RandomLatencyValidationModel',
      'RandomLatency': {
        'type': 'object',
        'properties': {
          'min': {
            'type': 'number',
            'minimum': 0
          },
          'max': {
            'type': 'number',
            'minimum': 1
          }
        },
        'required': [
          'max'
        ],
        'additionalProperties': false
      },
      '$ref': '#/RandomLatency'
    }
  }
}

export {
  LatencyValidationModel
}
