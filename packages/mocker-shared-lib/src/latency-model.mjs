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

  generateValue () {
    return Math.floor(Math.random() * (this.max - this.min + 1)) + this.min
  }
}

export {
  FixedLatency,
  RandomLatency
}
