A mock server with learning mode.

[![Build Status](https://travis-ci.org/kroonprins/mocker.svg?branch=master)](https://travis-ci.org/kroonprins/mocker)

See [this sample application](https://github.com/kroonprins/mocker-sample) on how to use, or alternatively [this example](https://github.com/kroonprins/mocker-sample-docker) on how to use it with docker.

Mock server that responds to requests based on rules defined in yaml format. In these rules the response can be made dynamic based on the use of a templating engine.
Rules for the server can be created in different ways:
* use the user interface to create the rules manually
* use the learning mode to capture real requests to the server that is to be mocked. Based on these captured requests, rules can be created from the user interface
* edit the yaml files manually
