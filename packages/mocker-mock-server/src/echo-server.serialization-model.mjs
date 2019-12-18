import serializr from 'serializr'
import { Request } from './echo-server.model.mjs'

const { createModelSchema, primitive, map, raw } = { ...serializr }

const RequestSerializationModel = createModelSchema(Request, {
  method: primitive(),
  path: primitive(),
  fullPath: primitive(),
  body: raw(),
  params: map(),
  headers: map(),
  cookies: map()
})

export {
  RequestSerializationModel
}
