const expect = require('chai').expect
const axios = require('axios')
const MockServer = require('@kroonprins/mocker-mock-server-test/cjs/exports').MockServer

let mockServer

before(async function () {
  mockServer = new MockServer({
    port: 0,
    rule: {
      request: {
        method: 'GET',
        path: '/test'
      },
      response: {
        templatingEngine: 'nunjucks',
        statusCode: 200,
        contentType: 'text/plain',
        body: '{{"response " | appendText("body")}}'
      }
    },
    nunjucksTemplatingHelpersFile: 'templating-helper-cjs.js'
  })
  await mockServer.start()
})

describe('A test requiring a mock server', function () {
  it('should expect the rule to get one invocation', async function () {
    await axios.get(`http://localhost:${mockServer.port}/test`)

    expect(mockServer.for('/test', 'GET').invocations()).to.equal(1)
  })
})

after(function () {
  mockServer.stop()
})
