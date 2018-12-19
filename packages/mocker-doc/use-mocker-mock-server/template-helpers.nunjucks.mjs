import cows from 'cows'

export const HELPERS = {
  functions: {
    printCow: () => {
      const cowsList = cows()
      return cowsList[Math.floor((Math.random() * (cowsList.length - 1)))]
    }
  }
}
