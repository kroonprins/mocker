import chai from 'chai'
import { TemplatingService } from './../../lib/templating-service'
import { NunjucksTemplatingService } from './../../lib/templating-service.nunjucks'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'debug')
      .registerType(Logger, PinoLogger)
      .registerInstance('NunjucksTemplatingService', new NunjucksTemplatingService())

    let templatingService = new TemplatingService()

    const templatingEngines = await templatingService.listEngines()
    expect(templatingEngines.length).to.be.equal(2)
    expect(templatingEngines[0]).to.be.equal('none')
    expect(templatingEngines[1]).to.be.equal('nunjucks')

    let exceptionThrownBecauseUnknownTemplatingEngine = false
    try {
      await templatingService.render('nope', undefined, undefined)
    } catch (e) {
      expect(e.message).to.be.equal('Unknown templating engine nope')
      exceptionThrownBecauseUnknownTemplatingEngine = true
    }
    expect(exceptionThrownBecauseUnknownTemplatingEngine).to.be.equal(true)

    const resultForNone = await templatingService.render('none', 'Hello {{name}}', { name: 'world' })
    expect(resultForNone).to.be.equal('Hello {{name}}')

    const resultForNunjucks = await templatingService.render('nunjucks', 'Hello {{name}}', { name: 'world' })
    expect(resultForNunjucks).to.be.equal('Hello world')
  } finally {
    config.reset()
  }
}

export {
  test
}
