import serializr from 'serializr'
import { FixedLatency, RandomLatency } from './latency-model'

const { createModelSchema, primitive } = { ...serializr }

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
