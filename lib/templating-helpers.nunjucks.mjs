const HELPERS = {
  filters: {
    // E.g.
    // prependText: (str, text) => {
    //   return text + str
    // },
    // appendText: (str, text) => {
    //   return str + text
    // }
    //
    // In template: {{var | prependText("x")}}
  },
  functions: {
    // E.g.
    // writeA: () => {
    //   return 'A'
    // },
    // writeText: (text) => {
    //   return text
    // }
    //
    // In template: {{writeText("x")}}
  }
}

class NunjucksTemplatingHelpers {
  constructor () {
    Object.assign(this, HELPERS)
  }
}

export {
  NunjucksTemplatingHelpers
}
