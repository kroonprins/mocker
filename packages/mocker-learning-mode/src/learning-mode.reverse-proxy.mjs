import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import cors from 'cors'
import timestamp from 'express-timestamp'
import moment from 'moment-timezone'
import proxy from 'http-proxy-middleware'
import tough from 'tough-cookie'
import { Server } from '@kroonprins/mocker-shared-lib/server.service.mjs'
import { config } from '@kroonprins/mocker-shared-lib/config.mjs'
import { LearningModeService } from './learning-mode.service.mjs'
import { Request, NameValuePair, Response, ResponseCookie, RecordedRequest } from './learning-mode.model.mjs'
import { LearningModeServerEventEmitter, LearningModeServerEvents } from './learning-mode.server.events.mjs'

const Cookie = tough.Cookie

/**
 * Reverse proxy to capture requests for learning mode.
 *
 * @extends {Server}
 */
class LearningModeReverseProxyServer extends Server {
  /**
   * Creates an instance of LearningModeReverseProxyServer.
   *
   * @param {number} [port=config.getProperty('learning-mode.reverse-proxy.port')] The port on which the server should run.
   * @param {string} [bindAddress=config.getProperty('learning-mode.reverse-proxy.bind-address')] The address to which the server should bind.
   * @param {string} [targetHost=config.getProperty('learning-mode.reverse-proxy.target-host')] The address to which the server should proxy.
   * @param {string} [project=config.getProperty('project')] The project for which the captured requests should be stored.
   * @param {LearningModeService} [learningModeService=config.getInstance(LearningModeService)] An instance of LearningModeService
   * @param {LearningModeServerEventEmitter} [learningModeServerEventEmitter = config.getInstance(LearningModeServerEventEmitter))] An instance of LearningModeServerEventEmitter to emit events for certain server events (start/stop server, handle incoming request).
   * @memberof LearningModeReverseProxyServer
   */
  constructor (port = config.getProperty('learning-mode.reverse-proxy.port')
    , bindAddress = config.getProperty('learning-mode.reverse-proxy.bind-address')
    , targetHost = config.getProperty('learning-mode.reverse-proxy.target-host')
    , project = config.getProperty('project')
    , learningModeService = config.getInstance(LearningModeService)
    , learningModeServerEventEmitter = config.getInstance(LearningModeServerEventEmitter)
  ) {
    super(port, bindAddress, 'learning-mode.reverse-proxy')
    this.targetHost = targetHost
    this.project = project
    this.learningModeService = learningModeService
    this.learningModeServerEventEmitter = learningModeServerEventEmitter
  }

  async _setup () {
    this.logger.info('Proxying to %s for project %s', this.targetHost, this.project)
    this.app.use(cookieParser())
    this.app.use(bodyParser.text({
      type: '*/*'
    }))
    this.app.use(cors())
    this.app.use(timestamp.init)

    this.app.use('/', proxy({
      target: this.targetHost,
      changeOrigin: true,
      logLevel: 'debug', // setting it to the lowest because the level of the logProvider will decide the level in the end
      logProvider: (provider) => {
        return this.logger
      },
      cookieDomainRewrite: {
        '*': ''
      },
      onProxyRes: async (proxyRes, req, res) => {
        let responseBody = ''
        proxyRes.on('data', (data) => { // TODO check if this works if gzipped data is received (https://serverfault.com/questions/56700/is-it-possible-to-enable-http-compression-for-requests)
          this.logger.debug('Received chunk of data from proxied server')
          responseBody += data.toString('utf-8')
        }).on('end', async () => {
          this.logger.debug('Full body received')
          await this.learningModeService.saveRecordedRequest(this._createRecordedRequest(this.project, req, proxyRes, responseBody))
          this.learningModeServerEventEmitter.emit(LearningModeServerEvents.REQUEST_RECEIVED, this._createRequestReceivedEvent())
        })
      }
    }))
  }

  async start () {
    await super.start()
    this.learningModeServerEventEmitter.emit(LearningModeServerEvents.SERVER_STARTED, this._createServerStartedEvent())
  }

  stop () {
    super.stop()
    this.learningModeServerEventEmitter.emit(LearningModeServerEvents.SERVER_STOPPED, this._createServerStoppedEvent())
  }

  // Map an object to a list of NameValuePair instances. filterProps is a Set that can contain object properties to ignore.
  _mapToNameValuePairList (obj, filterProps = null) {
    this.logger.debug(obj, 'map to NameValuePair with filter %s', filterProps)
    if (!obj) {
      return []
    }

    const res = []
    for (let prop of Object.keys(obj)) {
      if (filterProps && filterProps.has(prop)) {
        continue
      }
      this.logger.debug("add NameValuePair for '%s' and '%s'", prop, obj[prop])
      res.push(new NameValuePair(prop, obj[prop].toString()))
    }
    return res
  }

  // Transform the value of a 'set-cookie' response header to a list of ResponseCookie objects
  _parseResponseCookies (cookiesHeader) {
    this.logger.debug('parsing response cookie header %s', cookiesHeader)
    if (!cookiesHeader || cookiesHeader.length === 0) {
      return []
    }

    let cookies
    if (cookiesHeader instanceof Array) {
      cookies = cookiesHeader.map(Cookie.parse)
    } else {
      cookies = [Cookie.parse(cookiesHeader)]
    }

    return cookies.map((cookie) => {
      let properties = {}
      // if(cookie.domain) properties.domain = cookie.domain;
      if (cookie.expires && cookie.expires instanceof Date) properties.expires = cookie.expires.toISOString()
      if (cookie.httpOnly) properties.httpOnly = cookie.httpOnly
      if (cookie.maxAge) properties.maxAge = cookie.maxAge
      if (cookie.path) properties.path = cookie.path
      if (cookie.secure) properties.secure = cookie.secure
      // if(cookie.signed) properties.signed = cookie.signed; TODO
      if (cookie.sameSite) properties.sameSite = cookie.sameSite
      return new ResponseCookie(
        cookie.key,
        cookie.value,
        properties
      )
    })
  }

  // Create an instance of a RecordedRequest from the request and response.
  _createRecordedRequest (projectName, req, res, responseBody) {
    const requestBody = typeof req.body === 'object' ? '' : req.body // for some mysterious reason body-parser makes body an empty object when there is no body
    const request = new Request(
      req.method,
      req.path,
      req.originalUrl,
      requestBody,
      this._mapToNameValuePairList(req.query),
      this._mapToNameValuePairList(req.headers, new Set(['cookie'])),
      this._mapToNameValuePairList(req.cookies)
    )
    this.logger.debug(request, 'constructed request for recorded request')

    const contentType = res.headers['content-type']
    const response = new Response(
      contentType,
      res.statusCode,
      this._calculateElapsed(req),
      responseBody,
      this._mapToNameValuePairList(res.headers, new Set(['content-type', 'set-cookie'])),
      this._parseResponseCookies(res.headers['set-cookie'])
    )
    this.logger.debug(response, 'constructed response for recorded request')
    return new RecordedRequest(undefined, projectName, new Date(), request, response)
  }

  _calculateElapsed (req) {
    return moment.duration(moment().diff(req.timestamp)).asMilliseconds()
  }

  _createServerStartedEvent () {
    return {
      timestamp: Date.now(),
      port: this.port,
      bindAddres: this.bindAddres,
      project: this.project
    }
  }

  _createServerStoppedEvent () {
    return {
      timestamp: Date.now(),
      project: this.project
    }
  }

  _createRequestReceivedEvent () {
    return {
      timestamp: Date.now(),
      project: this.project
    }
  }
}

export {
  LearningModeReverseProxyServer
}
