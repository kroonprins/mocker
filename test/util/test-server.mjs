import express from 'express';
import cookieParser from 'cookie-parser';
import _ from 'express-async-errors';

import { logger } from './../../lib/logging';

class TestServer {
    constructor(port) {
        this.port = port;
        this.server = null;
    }

    start() {
        logger.debug("Starting test server on port %s", this.port);

        const app = express();
        app.use(cookieParser());

        app.get('/test1', async (req, res) => {
            res.cookie("koek", "njamnjam", { httpOnly: true, secure: true });
            res.header('x-test', 'a');
            res.send("test1");
        });

        return new Promise((resolve, reject) => {
            this.server = app.listen(this.port, () => {
                logger.info("Test server started on port %d", this.port);
                resolve();
            });
        });
    }
    stop() {
        logger.debug("Request to stop the test server");
        if(this.server != null) {
            logger.info("Stopping the test server");
            return new Promise((resolve, reject) => {
                this.server.close(() => {
                    logger.info("Stopped the test server");
                    resolve();
                });
            });
        }
    }

}

export {
    TestServer
}