import { Rule, Request, Response, Header, Cookie } from './rule-model';
import { createModelSchema, primitive, list, object, map } from './serializr-es6-module-loader';

const RuleSerializationModel = createModelSchema(Rule, {
    request: object(Request),
    response: object(Response),
});

const RequestSerializationModel = createModelSchema(Request, {
    path: primitive(),
    method: primitive(),
});

const HeaderSerializationModel = createModelSchema(Header, {
    name: primitive(),
    value: primitive(),
});

const CookieSerializationModel = createModelSchema(Cookie, {
    name: primitive(),
    value: primitive(),
    properties: map(),
});

const ResponseSerializationModel = createModelSchema(Response, {
    contentType: primitive(),
    statusCode: primitive(),
    headers: list(object(Header)),
    cookies: list(object(Cookie)),
    body: primitive(),
});

export { RuleSerializationModel, RequestSerializationModel, HeaderSerializationModel, CookieSerializationModel, ResponseSerializationModel };