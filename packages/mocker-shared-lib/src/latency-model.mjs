// TODO add units

class FixedLatency {
  constructor (value) {
    this.value = value
  }
}

class RandomLatency {
  constructor (min, max) {
    this.min = min
    this.max = max
  }
}

export {
  FixedLatency,
  RandomLatency
}
