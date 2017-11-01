import express from 'express';
import cookieParser from 'cookie-parser';
import _ from 'express-async-errors';

import { ProjectService } from './project-service';
import { TemplatingService } from './templating-service';
import { logger } from './logging';

const _processRules = async (app, project) => {
    const rules = await ProjectService.getRules(project);
    for(let rule of rules) {
        const ruleRequest = rule.request;
        const ruleResponse = rule.response;

        app[ruleRequest.method](ruleRequest.path, async function (req, res) {
            const templateEnvironment = {
                req: req,
                res: res
            };
            // "object -> json string + templating -> object" is done to avoid having to template each attribute of the object seperately...
            const templateRenderedResponse = JSON.parse(await TemplatingService.render(JSON.stringify(ruleResponse), templateEnvironment));

            res.type(templateRenderedResponse.contentType);
            res.status(templateRenderedResponse.statusCode)
            for(let header of templateRenderedResponse.headers) {
                res.header(header.name, header.value);
            }
            for(let cookie of templateRenderedResponse.cookies) {
                res.cookie(cookie.name, cookie.value, cookie.properties);
            }
            res.send(templateRenderedResponse.body);
        });

    }
}

class MockServer {
    constructor(port, project) {
        this.port = port;
        this.project = project;
    }

    start() {
        const app = express();
        app.use(cookieParser());
        
        _processRules(app, this.project);
        
        app.listen(this.port, () => {
            logger.info('Mock server started on port %d!', this.port);
        });
    }
}

export { MockServer };