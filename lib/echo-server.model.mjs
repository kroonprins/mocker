
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

export {
  Request
}
