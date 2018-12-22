A mock server with learning mode.

[![Build Status](https://travis-ci.org/kroonprins/mocker.svg?branch=master)](https://travis-ci.org/kroonprins/mocker)

See [here](https://github.com/kroonprins/mocker/blob/master/packages/mocker-doc/README.adoc) on how to use.

Mocker consists of:

* A UI for management
* A mock server which responds to requests based on rules. Those rules are described in yaml files.
* A learning mode reverse proxy server. In learning mode, requests to the real server that the mock server should mock are captured. From the UI these captured requests can be transformed into rules for the mock server.
* A specific version of the mock server for use in javascript-based unit and integration tests.
