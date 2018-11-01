import { Request } from './echo-server.model'
import { createModelSchema, primitive, map, raw } from './mjs_workaround/serializr-es6-module-loader'

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
