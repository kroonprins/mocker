import chai from 'chai';
const expect = chai.expect;
import chaiExclude from 'chai-exclude';
import chaiString from 'chai-string';
chai.use(chaiString);
chai.use(chaiExclude);

import portastic from 'portastic';
import axios from 'axios';

import { logger } from './../../lib/logging';
import { TestServer } from './../util/test-server';
import { LearningModeReverseProxyServer } from './../../lib/learning-mode.reverse-proxy';
import { RecordedRequest } from './../../lib/learning-mode.model';
import { LearningModeService } from './../../lib/learning-mode.service';

// could split this up so that not all test run synchronously
const result = (async () => {
    const availablePorts = (await portastic.find({
        min: 30000,
        max: 40000,
        retrieve: 2
    }));
    const testServerPort = availablePorts[0];
    const reverseProxyPort = availablePorts[1];

    const testServer = new TestServer(testServerPort);
    const proxyServer = new LearningModeReverseProxyServer(reverseProxyPort, `http://localhost:${testServerPort}`, "reverseProxyTestProject");

    try {
        Promise.all([
            await testServer.start(),
            await proxyServer.start()
        ]);

        const checkEmptyDb = await LearningModeService.findRecordedRequests("reverseProxyTestProject");
        expect(checkEmptyDb.length).to.be.equal(0);

        const testServerResponse = await axios.get(`http://localhost:${testServerPort}/test1`);

        const proxiedRequestToBeEqualToTestServerResponse = await axios.get(`http://localhost:${reverseProxyPort}/test1`);
        expect(proxiedRequestToBeEqualToTestServerResponse.status).to.be.equal(200);
        expect(proxiedRequestToBeEqualToTestServerResponse.data).to.be.equal("test1");
        expect(proxiedRequestToBeEqualToTestServerResponse.headers['set-cookie'].length).to.be.equal(1);
        expect(proxiedRequestToBeEqualToTestServerResponse.headers['set-cookie'][0]).to.be.equal('koek=njamnjam; Path=/; HttpOnly; Secure');
        expect(proxiedRequestToBeEqualToTestServerResponse.headers['x-test']).to.be.equal('a');

        expect(proxiedRequestToBeEqualToTestServerResponse.status).to.be.equal(testServerResponse.status);
        expect(proxiedRequestToBeEqualToTestServerResponse.data).to.be.equal(testServerResponse.data);

        // TODO hoping for https://github.com/mesaugat/chai-exclude/pull/5/files
        // expect(proxiedRequestToBeEqualToTestServerResponse.headers).excluding('date').to.deep.equal(testServerResponse.headers);

        const checkRequestRecorded = await LearningModeService.findRecordedRequests("reverseProxyTestProject");
        expect(checkRequestRecorded.length).to.be.equal(1);
        const recorded = checkRequestRecorded[0];
        expect(recorded.id).is.not.empty;
        expect(recorded.project).to.be.equal("reverseProxyTestProject");
        expect(recorded.request.method).to.be.equal("GET");
        expect(recorded.request.path).to.be.equal("/test1");
        expect(recorded.request.fullPath).to.be.equal("/test1");
        expect(recorded.request.body).to.be.equal("");
        expect(recorded.request.headers.length).to.be.greaterThan(0);
        expect(recorded.response.contentType).to.startsWith("text/html");
        expect(recorded.response.statusCode).to.be.equal(200);
        expect(recorded.response.body).to.be.equal("test1");
        expect(recorded.response.cookies.length).to.be.equal(1);
        expect(recorded.response.cookies[0].name).to.be.equal('koek');
        expect(recorded.response.cookies[0].value).to.be.equal('njamnjam');
        expect(recorded.response.cookies[0].properties.httpOnly).to.be.true;
        expect(recorded.response.cookies[0].properties.secure).to.be.true;
        expect(recorded.response.cookies[0].properties.path).to.be.equal('/');


        const secondRequest = await axios.get(`http://localhost:${reverseProxyPort}/test1?q1=param1&q2=param2`, {
            headers: {
                'X-test': 'header1',
                'X-tost': 'header2',
                Cookie: "cookie1=c1; cookie2=c2;"
            }
        });
        expect(secondRequest.status).to.be.equal(200);
        const checkSecondRequestRecorded = await LearningModeService.findRecordedRequests("reverseProxyTestProject");
        expect(checkSecondRequestRecorded.length).to.be.equal(2);
        const secondRecordedRequest = checkSecondRequestRecorded.filter((req) => {
            return req.id !== recorded.id;
        })[0];
        expect(secondRecordedRequest.project).to.be.equal("reverseProxyTestProject");
        expect(secondRecordedRequest.request.method).to.be.equal("GET");
        expect(secondRecordedRequest.request.path).to.be.equal("/test1");
        expect(secondRecordedRequest.request.fullPath).to.be.equal("/test1?q1=param1&q2=param2");
        expect(secondRecordedRequest.request.params[0].name).to.be.equal("q1");
        expect(secondRecordedRequest.request.params[0].value).to.be.equal("param1");
        expect(secondRecordedRequest.request.params[1].name).to.be.equal("q2");
        expect(secondRecordedRequest.request.params[1].value).to.be.equal("param2");
        const cookieHeader = secondRecordedRequest.request.headers.filter((header) => {
            return header.name === 'cookie';
        });
        expect(cookieHeader.length).to.be.equal(0);
        const xTestHeader = secondRecordedRequest.request.headers.filter((header) => {
            return header.name === 'x-test';
        })[0];
        expect(xTestHeader.value).to.be.equal("header1");
        const xTostHeader = secondRecordedRequest.request.headers.filter((header) => {
            return header.name === 'x-tost';
        })[0];
        expect(xTostHeader.value).to.be.equal("header2");
        expect(secondRecordedRequest.request.cookies[0].name).to.be.equal("cookie1");
        expect(secondRecordedRequest.request.cookies[0].value).to.be.equal("c1");
        expect(secondRecordedRequest.request.cookies[1].name).to.be.equal("cookie2");
        expect(secondRecordedRequest.request.cookies[1].value).to.be.equal("c2");
    } finally {
        Promise.all([
            await proxyServer.stop(),
            await testServer.stop()
        ]);
    }
})();