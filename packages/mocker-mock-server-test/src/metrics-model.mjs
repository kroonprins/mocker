class Metrics {
  constructor (invocations, requests) {
    this._invocations = invocations
    this._requests = requests
  }

  static empty () {
    return new Metrics(0, [])
  }

  invocations () {
    return this._invocations
  }

  ruleName () {
    const lastRequest = this._getLastRequest()
    return lastRequest.projectRule.rule.name
  }

  ruleLocation () {
    const lastRequest = this._getLastRequest()
    return lastRequest.projectRule.location
  }

  path () {
    const lastRequest = this._getLastRequest()
    return lastRequest.req.path
  }

  fullPath () {
    const lastRequest = this._getLastRequest()
    return lastRequest.req.originalUrl
  }

  header (name) {
    const lastRequest = this._getLastRequest()
    return lastRequest.req.header(name)
  }

  query (name) {
    const lastRequest = this._getLastRequest()
    return lastRequest.req.query[name]
  }

  cookie (name) {
    const lastRequest = this._getLastRequest()
    return lastRequest.req.cookies[name]
  }

  body () {
    const lastRequest = this._getLastRequest()
    return lastRequest.req.body
  }

  _getLastRequest () {
    return this._requests[this._requests.length - 1]
  }
}

class GlobalMetrics {
  constructor (invocations) {
    this._invocations = invocations
  }

  static empty () {
    return new GlobalMetrics(0)
  }

  invocations () {
    return this._invocations
  }
}

export {
  Metrics,
  GlobalMetrics
}
