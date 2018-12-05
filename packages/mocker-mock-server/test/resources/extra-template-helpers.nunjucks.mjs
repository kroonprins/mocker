export const HELPERS = {
  filters: {
    appendText: (str, text) => {
      return str + text + ' overwritten'
    },
    extraAppend: (str, text) => {
      return str + text + ' extra'
    }
  },
  functions: {
    writeA: () => {
      return 'overwrittenA'
    },
    writeZ: () => {
      return 'Z'
    }
  }
}
