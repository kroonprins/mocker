import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import _ from 'express-async-errors';
import proxy from 'http-proxy-middleware';
import tough from 'tough-cookie';
const Cookie = tough.Cookie;

import { LearningModeService } from './learning-mode.service';
import { Request, NameValuePair, Response, ResponseCookie, RecordedRequest } from './learning-mode.model';
import { logger } from './logging';

const _mapToNameValuePairList = (obj, filterProps = null) => {
    logger.debug(obj, "map to NameValuePair with filter %s", filterProps);
    if (!obj) {
        return [];
    }

    const res = [];
    for (let prop of Object.keys(obj)) {
        if (filterProps && filterProps.has(prop)) {
            continue;
        }
        logger.debug("add NameValuePair for '%s' and '%s'", prop, obj[prop]);
        res.push(new NameValuePair(prop, obj[prop]));
    }
    return res;
}

const _parseResponseCookies = (cookiesHeader) => {
    logger.debug("parsing response cookie header %s", cookiesHeader);
    if (!cookiesHeader || cookiesHeader.length === 0) {
        return [];
    }

    let cookies;
    if (cookiesHeader instanceof Array) {
        cookies = cookiesHeader.map(Cookie.parse);
    } else {
        cookies = [Cookie.parse(cookiesHeader)];
    }

    return cookies.map((cookie) => {
        let properties = {};
        // if(cookie.domain) properties.domain = cookie.domain;
        if(cookie.expires && cookie.expires instanceof Date) properties.expires = cookie.expires.toISOString();
        if(cookie.httpOnly) properties.httpOnly = cookie.httpOnly;
        if(cookie.maxAge) properties.maxAge = cookie.maxAge;
        if(cookie.path) properties.path = cookie.path;
        if(cookie.secure) properties.secure = cookie.secure;
        // if(cookie.signed) properties.signed = cookie.signed; TODO
        if(cookie.sameSite) properties.sameSite = cookie.sameSite;
        return new ResponseCookie(
            cookie.key,
            cookie.value,
            properties
        );
    })
}

const _createRecordedRequest = (projectName, req, res, responseBody) => {
    const requestBody = typeof req.body === 'object' ? '' : req.body; // for some mysterious reason body-parser makes body an empty object when there is no body
    const request = new Request(
        req.method,
        req.path,
        req.originalUrl,
        requestBody,
        _mapToNameValuePairList(req.query),
        _mapToNameValuePairList(req.headers, new Set(['cookie'])),
        _mapToNameValuePairList(req.cookies)
    );
    logger.debug(request, "constructed request for recorded request");

    const contentType = res.headers['content-type'];
    const response = new Response(
        contentType,
        res.statusCode,
        responseBody,
        _mapToNameValuePairList(res.headers.filter, new Set(['content-type', 'set-cookie'])),
        _parseResponseCookies(res.headers['set-cookie'])
    );
    logger.debug(response, "constructed response for recorded request");
    return new RecordedRequest(undefined, projectName, new Date(), request, response);
}

class LearningModeReverseProxyServer {
    constructor(port, targetHost, project) {
        this.port = port;
        this.targetHost = targetHost;
        this.project = project;
        this.server = null;
    }

    start() {
        logger.debug("Starting learning mode reverse proxy server on port %s for target host '%s'", this.port, this.targetHost);

        const app = express();
        app.use(cookieParser());
        app.use(bodyParser.text({
            type: '*/*'
        }));
        app.disable('x-powered-by');

        app.use('/', proxy({
            target: this.targetHost,
            changeOrigin: true,
            logProvider: () => {
                return logger;
            },
            cookieDomainRewrite: {
                "*": ""
            },
            onProxyRes: async (proxyRes, req, res) => {
                let responseBody = "";
                proxyRes.on('data', function (data) {
                    logger.debug("Received chunk of data from proxied server");
                    responseBody += data.toString('utf-8');
                }).on('end', async () => {
                    logger.debug("Full body received");
                    await LearningModeService.saveRecordedRequest(_createRecordedRequest(this.project, req, proxyRes, responseBody));
                });
            }
        }));

        return new Promise((resolve, reject) => {
            this.server = app.listen(this.port, () => {
                logger.info("Learning mode reverse proxy server started on port %d for target host '%s'", this.port, this.targetHost);
                resolve();
            });
        });
    }
    stop() {
        logger.debug("Request to stop the learning mode reverse proxy server");
        if (this.server != null) {
            logger.info("Stopping the learning mode reverse proxy server");
            return new Promise((resolve, reject) => {
                this.server.close(() => {
                    logger.info("Stopped the learning mode reverse proxy server");
                    resolve();
                });
            });
        }
    }

}

export {
    LearningModeReverseProxyServer
}