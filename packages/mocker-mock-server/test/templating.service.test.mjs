import chai from 'chai'
import { TemplatingService } from '../src/templating.service'
import { NunjucksTemplatingService } from '../src/templating.service.nunjucks'
import { Logger, PinoLogger } from '@kroonprins/mocker-shared-lib/logging'
import { config } from '@kroonprins/mocker-shared-lib/config'
import { NunjucksTemplatingHelpers } from '../src/templating-helpers.nunjucks'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    class TestNunjucksTemplatingHelpers {
      constructor () {
        this.filters = {
          prependText: (str, text) => {
            return text + str
          },
          appendText: (str, text) => {
            return str + text
          }
        }
        this.functions = {
          writeA: () => {
            return 'A'
          },
          writeText: (text) => {
            return text
          }
        }
      }

      init () {
        return Promise.resolve(this)
      }
    }

    class TestNunjucksTemplatingHelpersWithExtraHelpers extends NunjucksTemplatingHelpers {
      constructor () {
        super('./test/resources/extra-template-helpers.nunjucks.mjs')
        this.DEFAULT_HELPERS = {
          filters: {
            prependText: (str, text) => {
              return text + str
            },
            appendText: (str, text) => {
              return str + text
            }
          },
          functions: {
            writeA: () => {
              return 'A'
            },
            writeText: (text) => {
              return text
            }
          }
        }
      }
    }

    config
      .registerProperty('logging.level.startup', 'debug')
      .registerType(Logger, PinoLogger)
      .registerInstance('NunjucksTemplatingService', new NunjucksTemplatingService(new TestNunjucksTemplatingHelpers()))

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

    const resultForNunjucksHelperFunction1 = await templatingService.render('nunjucks', 'Hello {{name}} {{writeA()}}', { name: 'world' })
    expect(resultForNunjucksHelperFunction1).to.be.equal('Hello world A')

    const resultForNunjucksHelperFunction2 = await templatingService.render('nunjucks', 'Hello {{name}} {{writeText("text")}}', { name: 'world' })
    expect(resultForNunjucksHelperFunction2).to.be.equal('Hello world text')

    const resultForNunjucksHelperFilter1 = await templatingService.render('nunjucks', 'Hello {{name | prependText("brave new ")}}', { name: 'world' })
    expect(resultForNunjucksHelperFilter1).to.be.equal('Hello brave new world')

    const resultForNunjucksHelperFilter2 = await templatingService.render('nunjucks', 'Hello {{name | prependText("brave new ") | appendText("s")}}', { name: 'world' })
    expect(resultForNunjucksHelperFilter2).to.be.equal('Hello brave new worlds')

    config
      .registerInstance('NunjucksTemplatingService', new NunjucksTemplatingService(new TestNunjucksTemplatingHelpersWithExtraHelpers()))

    const templatingServiceWithExtraHelpers = new TemplatingService()

    const resultForNoneWithExtraHelpers = await templatingServiceWithExtraHelpers.render('none', 'Hello {{name}}', { name: 'world' })
    expect(resultForNoneWithExtraHelpers).to.be.equal('Hello {{name}}')

    const resultForNunjucksWithExtraHelpers = await templatingServiceWithExtraHelpers.render('nunjucks', 'Hello {{name}}', { name: 'world' })
    expect(resultForNunjucksWithExtraHelpers).to.be.equal('Hello world')

    const resultForNunjucksHelperFunction1WithExtraHelpers = await templatingServiceWithExtraHelpers.render('nunjucks', 'Hello {{name}} {{writeA()}}', { name: 'world' })
    expect(resultForNunjucksHelperFunction1WithExtraHelpers).to.be.equal('Hello world overwrittenA')

    const resultForNunjucksHelperFunction2WithExtraHelpers = await templatingServiceWithExtraHelpers.render('nunjucks', 'Hello {{name}} {{writeText("text")}}', { name: 'world' })
    expect(resultForNunjucksHelperFunction2WithExtraHelpers).to.be.equal('Hello world text')

    const resultForNunjucksHelperFunction3WithExtraHelpers = await templatingServiceWithExtraHelpers.render('nunjucks', 'Hello {{name}} {{writeZ()}}', { name: 'world' })
    expect(resultForNunjucksHelperFunction3WithExtraHelpers).to.be.equal('Hello world Z')

    const resultForNunjucksHelperFilter1WithExtraHelpers = await templatingServiceWithExtraHelpers.render('nunjucks', 'Hello {{name | prependText("brave new ")}}', { name: 'world' })
    expect(resultForNunjucksHelperFilter1WithExtraHelpers).to.be.equal('Hello brave new world')

    const resultForNunjucksHelperFilter2WithExtraHelpers = await templatingServiceWithExtraHelpers.render('nunjucks', 'Hello {{name | prependText("brave new ") | appendText("s")}}', { name: 'world' })
    expect(resultForNunjucksHelperFilter2WithExtraHelpers).to.be.equal('Hello brave new worlds overwritten')

    const resultForNunjucksHelperFilter3WithExtraHelpers = await templatingServiceWithExtraHelpers.render('nunjucks', 'Hello {{name | prependText("brave new ") | extraAppend("s")}}', { name: 'world' })
    expect(resultForNunjucksHelperFilter3WithExtraHelpers).to.be.equal('Hello brave new worlds extra')
  } finally {
    config.reset()
  }
}

export {
  test
}
