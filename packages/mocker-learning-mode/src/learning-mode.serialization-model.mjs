import serializr from 'serializr'
import { Request, NameValuePair, Response, ResponseCookie, RecordedRequest } from './learning-mode.model'

const { createModelSchema, primitive, identifier, date, alias, list, object, map } = { ...serializr }

const NameValuePairSerializationModel = createModelSchema(NameValuePair, {
  name: primitive(),
  value: primitive()
})

const ResponseCookieSerializationModel = createModelSchema(ResponseCookie, {
  name: primitive(),
  value: primitive(),
  properties: map()
})

const RequestSerializationModel = createModelSchema(Request, {
  method: primitive(),
  path: primitive(),
  fullPath: primitive(),
  body: primitive(),
  params: list(object(NameValuePairSerializationModel)),
  headers: list(object(NameValuePairSerializationModel)),
  cookies: list(object(NameValuePairSerializationModel))
})

const LimitedDataRequestSerializationModel = createModelSchema(Request, {
  method: primitive(),
  fullPath: primitive()
})

const ResponseSerializationModel = createModelSchema(Response, {
  contentType: primitive(),
  statusCode: primitive(),
  body: primitive(),
  headers: list(object(NameValuePairSerializationModel)),
  cookies: list(object(ResponseCookieSerializationModel))
})

const RecordedRequestSerializationModel = createModelSchema(RecordedRequest, {
  id: alias('_id', identifier()),
  project: primitive(),
  timestamp: date(),
  request: object(RequestSerializationModel),
  response: object(ResponseSerializationModel)
})

const LimitedDataRecordedRequestSerializationModel = createModelSchema(RecordedRequest, {
  id: alias('_id', identifier()),
  timestamp: date(),
  request: object(LimitedDataRequestSerializationModel)
})

export {
  RequestSerializationModel,
  LimitedDataRequestSerializationModel,
  NameValuePairSerializationModel,
  ResponseSerializationModel,
  ResponseCookieSerializationModel,
  RecordedRequestSerializationModel,
  LimitedDataRecordedRequestSerializationModel
}
