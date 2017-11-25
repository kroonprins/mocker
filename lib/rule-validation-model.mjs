const RequestValidationModel = {
  '$id': 'uri://mocker/rule/RequestValidationModel',
  'Request': {
    'type': 'object',
    'properties': {
      'method': {
        'type': 'string',
        'enum': [ // TODO get from a function
          'GET',
          'HEAD',
          'POST',
          'PUT',
          'DELETE',
          'CONNECT',
          'OPTIONS',
          'TRACE',
          'PATCH'
        ]
      },
      'path': {
        'type': 'string',
        'pattern': '/.*' // TODO good check for path
      }
    },
    'required': [
      'method', 'path'
    ],
    'additionalProperties': false
  },
  '$ref': '#/Request'
}

const HeaderValidationModel = {
  '$id': 'uri://mocker/rule/HeaderValidationModel',
  'Header': {
    'type': 'object',
    'properties': {
      'name': {
        'type': 'string'
      },
      'value': {
        'type': [ 'string', 'null' ]
      }
    },
    'required': [
      'name'
    ],
    'additionalProperties': false
  },
  '$ref': '#/Header'
}

const CookieValidationModel = {
  '$id': 'uri://mocker/rule/CookieValidationModel',
  'Cookie': {
    'type': 'object',
    'properties': {
      'name': {
        'type': 'string'
      },
      'value': {
        'type': [ 'string', 'null' ]
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
            'type': [ 'string', 'object' ] // TODO could be date object as well as string?
          },
          'httpOnly': {
            'type': 'boolean'
          },
          'maxAge': {
            'type': 'integer',
            'minimum': 0
          },
          'path': {
            'type': 'string'
          },
          'secure': {
            'type': 'boolean'
          },
          'signed': {
            'type': 'boolean'
          },
          'sameSite': {
            'type': [ 'boolean', 'string' ]
          }
        },
        'additionalProperties': false
      }
    },
    'required': [
      'name'
    ],
    'additionalProperties': false
  },
  '$ref': '#/Cookie'
}

const ResponseValidationModel = {
  '$id': 'uri://mocker/rule/ResponseValidationModel',
  'Response': {
    'type': 'object',
    'properties': {
      'templatingEngine': {
        'type': 'string',
        'enum': [ // TODO get from a function
          'none',
          'nunjucks'
        ]
      },
      'contentType': {
        'type': 'string' // TODO get list of values from function?
      },
      'statusCode': {
        'type': 'integer' // TODO get list of all allowed?
      },
      'headers': {
        'type': 'array',
        'items': {
          '$ref': `${HeaderValidationModel.$id}#/Header`
        }
      },
      'cookies': {
        'type': 'array',
        'items': {
          '$ref': `${CookieValidationModel.$id}#/Cookie`
        }
      },
      'body': {
        'type': 'string'
      }
    },
    'required': [
      'templatingEngine', 'contentType', 'statusCode' // TODO is content-type mandatory response header in http spec?
    ],
    'additionalProperties': false
  },
  '$ref': '#/Response'
}

const RuleValidationModel = {
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
        '$ref': `${RequestValidationModel.$id}#/Request`
      },
      'response': {
        '$ref': `${ResponseValidationModel.$id}#/Response`
      }
    },
    'required': [
      'name', 'request', 'response'
    ],
    'additionalProperties': false
  },
  '$ref': '#/Response'
}

export { RequestValidationModel, HeaderValidationModel, CookieValidationModel, ResponseValidationModel, RuleValidationModel }
