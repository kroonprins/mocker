import { ValidationModel } from './app-class-validation.service'
import { Request, Header, Cookie, Response, Rule } from './rule-model'
import { ConfigService } from './config.service'
import { config } from './config'

class RuleValidationModel extends ValidationModel {
  constructor (configService = config.getInstance(ConfigService)) {
    super()
    this[Request] = {
      '$id': 'uri://mocker/rule/RequestValidationModel',
      'Request': {
        'type': 'object',
        'properties': {
          'method': {
            'type': 'string',
            'enum': configService.getSync('http-methods')
          },
          'path': {
            'type': 'string',
            'pattern': '/.*' // TODO good check for path
          }
        },
        'required': [
          'method', 'path'
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/Request'
    }

    this[Header] = {
      '$id': 'uri://mocker/rule/HeaderValidationModel',
      'Header': {
        'type': 'object',
        'properties': {
          'name': {
            'type': 'string'
          },
          'value': {
            'type': ['string', 'null']
          }
        },
        'required': [
          'name'
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/Header'
    }

    this[Cookie] = {
      '$id': 'uri://mocker/rule/CookieValidationModel',
      'Cookie': {
        'type': 'object',
        'properties': {
          'name': {
            'type': 'string'
          },
          'value': {
            'type': ['string', 'null']
          },
          'properties': {
            'type': 'object',
            'properties': {
              'domain': {
                'type': 'string'
              },
              'encode': {
                'type': 'string'
              },
              'expires': {
                // 'type': 'string',
                // 'format': 'date'
                'type': ['string', 'object'] // TODO could be date object as well as string?
              },
              'httpOnly': {
                'type': [ 'boolean', 'string' ] // string possible because can be template expression (TODO create format?)
              },
              'maxAge': {
                'type': [ 'integer', 'string' ],
                'minimum': 0
              },
              'path': {
                'type': 'string'
              },
              'secure': {
                'type': [ 'boolean', 'string' ]
              },
              'signed': {
                'type': [ 'boolean', 'string' ]
              },
              'sameSite': {
                'type': ['boolean', 'string']
              }
            },
            'additionalProperties': false
          }
        },
        'required': [
          'name'
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/Cookie'
    }

    this[Response] = {
      '$id': 'uri://mocker/rule/ResponseValidationModel',
      'Response': {
        'type': 'object',
        'properties': {
          'templatingEngine': {
            'type': 'string',
            'enum': configService.getSync('templating-types')
          },
          'contentType': {
            'type': 'string' // TODO get list of values from function?
          },
          'statusCode': {
            'type': [ 'integer', 'string' ] // TODO get list of all allowed?
          },
          'headers': {
            'type': 'array',
            'items': {
              '$ref': `${this[Header].$id}#/Header`
            }
          },
          'cookies': {
            'type': 'array',
            'items': {
              '$ref': `${this[Cookie].$id}#/Cookie`
            }
          },
          'body': {
            'type': ['string', 'null']
          }
        },
        'required': [
          'templatingEngine', 'contentType', 'statusCode' // TODO is content-type mandatory response header in http spec?
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/Response'
    }

    this[Rule] = {
      '$id': 'uri://mocker/rule/RuleValidationModel',
      'Rule': {
        'type': 'object',
        'properties': {
          'name': {
            'type': 'string',
            'minLength': '1',
            'maxLength': '40'
          },
          'request': {
            '$ref': `${this[Request].$id}#/Request`
          },
          'response': {
            '$ref': `${this[Response].$id}#/Response`
          }
        },
        'required': [
          'name', 'request', 'response'
        ]
        // 'additionalProperties': false
      },
      '$ref': '#/Rule'
    }
  }
}

export {
  RuleValidationModel
}
