import { ResponseCookie, Cookie } from '../../shared/model/cookie';
import { NameValuePair } from '../../shared/model/name-value-pair';

class Request {
  method: string;
  path: string;
  fullPath: string;
  body: string;
  params: NameValuePair[];
  headers: NameValuePair[];
  cookies: Cookie[];
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
