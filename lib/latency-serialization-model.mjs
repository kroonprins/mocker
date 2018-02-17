import { FixedLatency, RandomLatency } from './latency-model'
import { createModelSchema, primitive } from './mjs_workaround/serializr-es6-module-loader'

const FixedLatencySerializationModel = createModelSchema(FixedLatency, {
  value: primitive()
})

const RandomLatencySerializationModel = createModelSchema(RandomLatency, {
  min: primitive(),
  max: primitive()
})

export {
  FixedLatencySerializationModel,
  RandomLatencySerializationModel
}
