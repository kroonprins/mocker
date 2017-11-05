
class Request {
  constructor (method, path, fullPath, body = '', params = [], headers = [], cookies = []) {
    this.method = method
    this.path = path
    this.fullPath = fullPath
    this.body = body
    this.params = params
    this.headers = headers
    this.cookies = cookies
  }
}

class NameValuePair {
  constructor (name, value) {
    this.name = name
    this.value = value
  }
}

class ResponseCookie {
  constructor (name, value, properties = {}) {
    this.name = name
    this.value = value
    this.properties = properties
  }
}

class Response {
  constructor (contentType, statusCode, body = '', headers = [], cookies = []) {
    this.contentType = contentType
    this.statusCode = statusCode
    this.body = body
    this.headers = headers
    this.cookies = cookies
  }
}

class RecordedRequest {
  constructor (id, project, timestamp, request, response) {
    this.id = id
    this.project = project
    this.timestamp = timestamp
    this.request = request
    this.response = response
  }
}

export {
  Request,
  NameValuePair,
  Response,
  ResponseCookie,
  RecordedRequest
}
