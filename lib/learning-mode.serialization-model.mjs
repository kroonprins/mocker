import { Request, NameValuePair, Response, ResponseCookie, RecordedRequest } from './learning-mode.model';
import { createModelSchema, primitive, identifier, alias, list, object, map } from './serializr-es6-module-loader';

const RequestSerializationModel = createModelSchema(Request, {
    method: primitive(),
    path: primitive(),
    fullPath: primitive(),
    body: primitive(),
    params: list(object(NameValuePair)),
    headers: list(object(NameValuePair)),
    cookies: list(object(NameValuePair))
});

const NameValuePairSerializationModel = createModelSchema(NameValuePair, {
    name: primitive(),
    value: primitive(),
});

const ResponseSerializationModel = createModelSchema(Response, {
    contentType: primitive(),
    statusCode: primitive(),
    body: primitive(),
    headers: list(object(NameValuePair)),
    cookies: list(object(ResponseCookie))
});

const ResponseCookieSerializationModel = createModelSchema(ResponseCookie, {
    name: primitive(),
    value: primitive(),
    properties: map()
});

const RecordedRequestSerializationModel = createModelSchema(RecordedRequest, {
    id: alias('_id', identifier()),
    project: primitive(),
    request: object(Request),
    response: object(Response)
});

export { RecordedRequestSerializationModel };