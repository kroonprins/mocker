class Request {
    constructor(path, method) {
        this.path = path;
        this.method = method;
    }
}

class Header {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}

class Cookie {
    constructor(name, value, properties = {}) {
        this.name = name;
        this.value = value;
        this.properties = properties;
    }
}

class Response {
    constructor(contentType, statusCode = 200, headers = [], cookies = [], body = null) {
        this.contentType = contentType;
        this.statusCode = statusCode;
        this.headers = headers;
        this.cookies = cookies;
        this.body = body;
    }
}

class Rule {
    constructor(request, response) {
        this.request = request;
        this.response = response;
    }
}

export { Rule, Request, Response, Header, Cookie }