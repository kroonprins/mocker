import { expect } from 'chai'
import 'mocha'
import axios from 'axios'
import { MockServer } from '@kroonprins/mocker-mock-server-test/cjs/exports'

let mockServer: MockServer

before(async function () {
  mockServer = new MockServer({
    port: 0,
    rule: {
      request: {
        method: 'GET',
        path: '/test'
      },
      response: {
        templatingEngine: 'none',
        statusCode: 200,
        contentType: 'text/plain',
        body: 'response body'
      }
    }
  })
  await mockServer.start()
})

describe('A TypeScript test requiring a mock server', function () {
  it('should expect the rule to get one invocation', async function () {
    await axios.get(`http://localhost:${mockServer.port}/test`)

    expect(mockServer.for('/test', 'GET').invocations()).to.equal(1)
  })
})

after(function () {
  mockServer.stop()
})
