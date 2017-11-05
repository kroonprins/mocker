import chai from 'chai'
import { TemplatingService } from './../../lib/templating-service'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  const templatingEngines = await TemplatingService.listEngines()
  expect(templatingEngines.length).to.be.equal(2)
  expect(templatingEngines[0]).to.be.equal('none')
  expect(templatingEngines[1]).to.be.equal('nunjucks')

  let exceptionThrownBecauseUnknownTemplatingEngine = false
  try {
    await TemplatingService.render('nope', undefined, undefined)
  } catch (e) {
    expect(e.message).to.be.equal('Unknown templating engine nope')
    exceptionThrownBecauseUnknownTemplatingEngine = true
  }
  expect(exceptionThrownBecauseUnknownTemplatingEngine).to.be.equal(true)

  const resultForNone = await TemplatingService.render('none', 'Hello {{name}}', { name: 'world' })
  expect(resultForNone).to.be.equal('Hello {{name}}')

  const resultForNunjucks = await TemplatingService.render('nunjucks', 'Hello {{name}}', { name: 'world' })
  expect(resultForNunjucks).to.be.equal('Hello world')
}

export {
  test
}
