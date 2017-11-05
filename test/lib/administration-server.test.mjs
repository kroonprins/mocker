import chai from 'chai'
import portastic from 'portastic'
import axios from 'axios'
import { logger } from './../../lib/logging'
import { AdministrationServer } from './../../lib/administration-server'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  const availablePort = (await portastic.find({
    min: 50000,
    max: 60000,
    retrieve: 1
  }))[0]

  const administrationServer = new AdministrationServer(availablePort)
  try {
    administrationServer.start()

    const initialLogLevel = logger.getLevel()
    expect(initialLogLevel).to.be.equal('info')

    const responseUpdateLoglevel = await axios.put(`http://localhost:${availablePort}/administration/loglevel`, {
      level: 'debug'
    })
    expect(responseUpdateLoglevel.status).to.be.equal(200)
    expect(logger.getLevel()).to.equal('debug')
    logger.setLevel(initialLogLevel)

    const responseUpdateLoglevelWithMaxAge = await axios.put(`http://localhost:${availablePort}/administration/loglevel`, {
      level: 'debug',
      maxAge: 1000
    })
    expect(responseUpdateLoglevelWithMaxAge.status).to.be.equal(200)
    expect(logger.getLevel()).to.equal('debug')
    await new Promise(resolve => setTimeout(resolve, 1000))
    expect(logger.getLevel()).to.equal(initialLogLevel)
  } finally {
    administrationServer.stop()
  }
}

export {
  test
}
