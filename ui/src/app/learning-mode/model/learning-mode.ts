class Request {
  method: string;
  path: string;
  fullPath: string;
  body: string;
  params: NameValuePair[];
  headers: NameValuePair[];
  cookies: NameValuePair[];
}

class NameValuePair {
  name: string;
  value: string;
}

class ResponseCookie {
  name: string;
  value: string;
  properties: object;
}

class Response {
  contentType: string;
  statusCode: number;
  body: string;
  headers: NameValuePair[];
  cookies: ResponseCookie[];
}

class RecordedRequest {
  _id: string;
  project: string;
  timestamp: number;
  request: Request;
  response: Response;
}

export {
  RecordedRequest
};
