import { MockServer, LearningModeServer } from './server-model'
import { LearningModeReverseProxyServer } from './learning-mode.reverse-proxy'
import { LearningModeForwardProxyServer } from './learning-mode.forward-proxy'
import { createModelSchema, primitive, custom, SKIP } from './mjs_workaround/serializr-es6-module-loader'

// TODO how to handle extends?
// const ServerSerializationModel = createModelSchema(Server, {
//   port: primitive(),
//   bindAddress: primitive(),
//   status: primitive()
// })

const MockServerSerializationModel = createModelSchema(MockServer, {
  port: primitive(),
  bindAddress: primitive(),
  status: primitive()
})

const LearningModeServerSerializationModel = createModelSchema(LearningModeServer, {
  port: primitive(),
  bindAddress: primitive(),
  status: primitive(),
  type: custom(
    function (value, key, object) { // serialize
      if (object instanceof LearningModeReverseProxyServer) {
        return 'reverse-proxy'
      } else if (object instanceof LearningModeForwardProxyServer) {
        return 'forward-proxy'
      } else {
        return SKIP
      }
    },
    function (value, context) { // deserialize
      return SKIP
    }
  ),
  targetHost: primitive()
})

export {
  MockServerSerializationModel,
  LearningModeServerSerializationModel
}
