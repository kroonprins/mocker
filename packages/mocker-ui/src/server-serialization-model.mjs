import serializr from 'serializr'
import { LearningModeReverseProxyServer, LearningModeForwardProxyServer } from '@kroonprins/mocker-learning-mode'
import { LearningModeServerTypes } from '@kroonprins/mocker-shared-lib/server.service.mjs'
import { MockServer, LearningModeServer } from './server-model.mjs'

const { createModelSchema, primitive, custom, SKIP } = { ...serializr }

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
        return LearningModeServerTypes.REVERSE_PROXY
      } else if (object instanceof LearningModeForwardProxyServer) {
        return LearningModeServerTypes.FORWARD_PROXY
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
