const expect = require('chai').expect
const MockServer = require('@kroonprins/mocker-mock-server-test/cjs/exports').MockServer

let mockServer

before(async function () {
  mockServer = new MockServer({
    port: 0,
    rule: {
      name: 'test rule 1',
      request: {
        method: 'POST',
        path: '/test1/:p1'
      },
      response: {
        templatingEngine: 'none',
        statusCode: 200,
        contentType: 'text/plain',
        body: 'rule 1'
      }
    }
  })
  await mockServer.start()
})

describe('A test requiring a mock server', function () {
  it('should return -1 when the value is not present', function () {
    expect('test').to.equal('test')
  })
})

after(function () {
  mockServer.stop()
})
