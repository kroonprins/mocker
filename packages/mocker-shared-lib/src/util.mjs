const wait = async (secs) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, secs)
  })
}

export {
  wait
}
