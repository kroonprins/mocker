class Request {
  constructor (path, method) {
    this.path = path
    this.method = method
  }

  set path (path) {
    this._path = path ? path.trim() : null
  }
  get path () {
    return this._path
  }
  set method (method) {
    this._method = method ? method.trim().toUpperCase() : null
  }
  get method () {
    return this._method
  }
}

class Header {
  constructor (name, value) {
    this.name = name
    this.value = value
  }

  set name (name) {
    this._name = name ? name.trim() : null
  }
  get name () {
    return this._name
  }
  set value (value) {
    this._value = value ? value.trim() : null
  }
  get value () {
    return this._value
  }
}

class Cookie {
  constructor (name, value, properties = {}) {
    this.name = name
    this.value = value
    this.properties = properties
  }

  set name (name) {
    this._name = name ? name.trim() : null
  }
  get name () {
    return this._name
  }
  set value (value) {
    this._value = value ? value.trim() : null
  }
  get value () {
    return this._value
  }
  set properties (properties) {
    this._properties = properties
  }
  get properties () {
    return this._properties
  }
}

class Response {
  constructor (templatingEngine, fixedLatency, randomLatency, contentType, statusCode = 200, headers = [], cookies = [], body = null) {
    this.templatingEngine = templatingEngine
    this.fixedLatency = fixedLatency
    this.randomLatency = randomLatency
    this.contentType = contentType
    this.statusCode = statusCode
    this.headers = headers
    this.cookies = cookies
    this.body = body
  }

  set templatingEngine (templatingEngine) {
    this._templatingEngine = templatingEngine
  }
  get templatingEngine () {
    return this._templatingEngine
  }
  set fixedLatency (fixedLatency) {
    this._fixedLatency = fixedLatency
  }
  get fixedLatency () {
    return this._fixedLatency
  }
  set randomLatency (randomLatency) {
    this._randomLatency = randomLatency
  }
  get randomLatency () {
    return this._randomLatency
  }
  set contentType (contentType) {
    this._contentType = contentType ? contentType.trim() : null
  }
  get contentType () {
    return this._contentType
  }
  set statusCode (statusCode) {
    this._statusCode = statusCode
  }
  get statusCode () {
    return this._statusCode
  }
  set headers (headers) {
    this._headers = headers
  }
  get headers () {
    return this._headers
  }
  set cookies (cookies) {
    this._cookies = cookies
  }
  get cookies () {
    return this._cookies
  }
  set body (body) {
    this._body = body
  }
  get body () {
    return this._body
  }
}

class ConditionalResponse {
  constructor (templatingEngine, response) {
    this.templatingEngine = templatingEngine
    this.response = response
  }

  set templatingEngine (templatingEngine) {
    this._templatingEngine = templatingEngine
  }
  get templatingEngine () {
    return this._templatingEngine
  }
  set response (response) {
    this._response = response
  }
  get response () {
    return this._response
  }
}

class ConditionalResponseValue {
  constructor (condition, fixedLatency, randomLatency, contentType, statusCode = 200, headers = [], cookies = [], body = null) {
    this.condition = condition
    this.fixedLatency = fixedLatency
    this.randomLatency = randomLatency
    this.contentType = contentType
    this.statusCode = statusCode
    this.headers = headers
    this.cookies = cookies
    this.body = body
  }

  set condition (condition) {
    this._condition = condition
  }
  get condition () {
    return this._condition
  }
  set fixedLatency (fixedLatency) {
    this._fixedLatency = fixedLatency
  }
  get fixedLatency () {
    return this._fixedLatency
  }
  set randomLatency (randomLatency) {
    this._randomLatency = randomLatency
  }
  get randomLatency () {
    return this._randomLatency
  }
  set contentType (contentType) {
    this._contentType = contentType ? contentType.trim() : null
  }
  get contentType () {
    return this._contentType
  }
  set statusCode (statusCode) {
    this._statusCode = statusCode
  }
  get statusCode () {
    return this._statusCode
  }
  set headers (headers) {
    this._headers = headers
  }
  get headers () {
    return this._headers
  }
  set cookies (cookies) {
    this._cookies = cookies
  }
  get cookies () {
    return this._cookies
  }
  set body (body) {
    this._body = body
  }
  get body () {
    return this._body
  }
}

class Rule {
  constructor (name, request, response, conditionalResponse) {
    this.name = name
    this.request = request
    this.response = response
    this.conditionalResponse = conditionalResponse
  }

  set name (name) {
    this._name = name ? name.trim() : null
  }
  get name () {
    return this._name
  }
  set request (request) {
    this._request = request
  }
  get request () {
    return this._request
  }
  set response (response) {
    this._response = response
  }
  get response () {
    return this._response
  }
  set conditionalResponse (conditionalResponse) {
    this._conditionalResponse = conditionalResponse
  }
  get conditionalResponse () {
    return this._conditionalResponse
  }
}

export {
  Rule,
  Request,
  Response,
  ConditionalResponse,
  ConditionalResponseValue,
  Header,
  Cookie
}
