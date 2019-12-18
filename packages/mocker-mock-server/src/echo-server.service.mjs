import serializr from 'serializr'
import { Logger } from '@kroonprins/mocker-shared-lib/logging.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { Request } from './echo-server.model.mjs'
import { RequestSerializationModel } from './echo-server.serialization-model.mjs'

const serialize = serializr.serialize

class EchoServerService {
  constructor () {
    this.logger = config.getClassInstance(Logger, { id: 'echo-service' })
  }

  createResponseFromExpressRequest (req) {
    const request = new Request(
      req.method,
      req.path,
      req.originalUrl,
      req.body,
      this._mapToObject(req.query),
      this._mapToObject(req.headers, new Set(['cookie'])),
      this._mapToObject(req.cookies)
    )
    this.logger.debug('Created echo response', request)
    return JSON.stringify(serialize(RequestSerializationModel, request))
  }

  _mapToObject (obj, filterProps = null) {
    this.logger.debug(obj, 'map to NameValuePair with filter %s', filterProps)
    if (!obj) {
      return []
    }

    const res = {}
    for (const prop of Object.keys(obj)) {
      if (filterProps && filterProps.has(prop)) {
        continue
      }
      this.logger.debug("add NameValuePair for '%s' and '%s'", prop, obj[prop])
      res[prop] = obj[prop].toString()
    }
    return res
  }
}

export {
  EchoServerService
}
