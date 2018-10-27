import chai from 'chai'
import chaiExclude from 'chai-exclude'
import portastic from 'portastic'
import axios from 'axios'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'
import { UiServer } from './../../lib/ui-server'
import { ApiServer } from './../../lib/api-server.mjs'
import { AdministrationServer } from './../../lib/administration-server.mjs'

const expect = chai.expect
chai.use(chaiExclude)

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'info')
      .registerType(Logger, PinoLogger)

    const availablePort = (await portastic.find({
      min: 50000,
      max: 60000,
      retrieve: 1
    }))[0]

    const uiServer = new UiServer(availablePort, 'localhost', 'test/util/statics')

    try {
      await uiServer.start()

      const basePath = await axios.get(`http://localhost:${availablePort}`)
      expect(basePath.status).to.equal(200)
      expect(basePath.data.trim()).to.equal('The index')

      const indexPath = await axios.get(`http://localhost:${availablePort}/index.html`)
      expect(indexPath.status).to.equal(200)
      expect(indexPath.data.trim()).to.equal('The index')

      const otherPath = await axios.get(`http://localhost:${availablePort}/other.html`)
      expect(otherPath.status).to.equal(200)
      expect(otherPath.data.trim()).to.equal('The other')

      const subPath = await axios.get(`http://localhost:${availablePort}/subdir/sub.html`)
      expect(subPath.status).to.equal(200)
      expect(subPath.data.trim()).to.equal('The sub')

      const randomPath = await axios.get(`http://localhost:${availablePort}/subdir/rrr/iiho/uu/oo`)
      expect(randomPath.status).to.equal(200)
      expect(randomPath.data.trim()).to.equal('The index')

      config
        .registerInstance(AdministrationServer, new AdministrationServer(60001, 'localhost'))
        .registerInstance(ApiServer, new ApiServer(60002, 'localhost', {}, {}, {}, {}))
      const configPath = await axios.get(`http://localhost:${availablePort}/config`)
      expect(configPath.status).to.equal(200)
      expect(configPath.data).to.deep.equal({
        apiServerLocation: 'http://localhost:60002',
        administrationServerLocation: 'http://localhost:60001'
      })
    } finally {
      await uiServer.stop()
    }
  } finally {
    config.reset()
  }
}

export {
  test
}
