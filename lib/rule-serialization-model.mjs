import { Rule, Request, Response, ConditionalResponse, ConditionalResponseValue, Header, Cookie } from './rule-model'
import { FixedLatencySerializationModel, RandomLatencySerializationModel } from './latency-serialization-model'
import { createModelSchema, primitive, list, object, map } from './mjs_workaround/serializr-es6-module-loader'

const RequestSerializationModel = createModelSchema(Request, {
  path: primitive(),
  method: primitive()
})

const HeaderSerializationModel = createModelSchema(Header, {
  name: primitive(),
  value: primitive()
})

const CookieSerializationModel = createModelSchema(Cookie, {
  name: primitive(),
  value: primitive(),
  properties: map()
})

const ResponseSerializationModel = createModelSchema(Response, {
  templatingEngine: primitive(),
  contentType: primitive(),
  statusCode: primitive(),
  headers: list(object(HeaderSerializationModel)),
  cookies: list(object(CookieSerializationModel)),
  body: primitive()
})

const ConditionalResponseValueSerializationModel = createModelSchema(ConditionalResponseValue, {
  condition: primitive(),
  contentType: primitive(),
  statusCode: primitive(),
  headers: list(object(HeaderSerializationModel)),
  cookies: list(object(CookieSerializationModel)),
  body: primitive()
})

const ConditionalResponseSerializationModel = createModelSchema(ConditionalResponse, {
  templatingEngine: primitive(),
  response: list(object(ConditionalResponseValueSerializationModel))
})

const RuleSerializationModel = createModelSchema(Rule, {
  name: primitive(),
  request: object(RequestSerializationModel),
  response: object(ResponseSerializationModel),
  conditionalResponse: object(ConditionalResponseSerializationModel),
  fixedLatency: object(FixedLatencySerializationModel),
  randomLatency: object(RandomLatencySerializationModel)
})

const LimitedDataRuleSerializationModel = createModelSchema(Rule, {
  name: primitive(),
  request: object(RequestSerializationModel)
})

export {
  RuleSerializationModel,
  RequestSerializationModel,
  HeaderSerializationModel,
  CookieSerializationModel,
  ResponseSerializationModel,
  ConditionalResponseSerializationModel,
  ConditionalResponseValueSerializationModel,
  LimitedDataRuleSerializationModel
}
