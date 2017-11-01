import express from 'express';
// import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import _ from 'express-async-errors';

import { logger } from './logging';

const _changeLogLevel = async function(req, res) {
    const newLevel = req.body.level;
    const currentLevel = logger.getLevel();
    logger.warn({
        newLevel: newLevel,
        currentLevel: currentLevel,
     }, "Updating log level");
     logger.setLevel(newLevel);

     const maxAge = req.body.maxAge;
     if(maxAge) {
         logger.warn("Log level will be reverted after %d ms", maxAge);
         setTimeout(() => {
            logger.warn({
                newLevel: newLevel,
                currentLevel: currentLevel,
             }, "Reverting log level");
             logger.setLevel(currentLevel);
         }, maxAge);
     }
     res.status(200);
     res.send();
};

class AdministrationServer {
    constructor(port) {
        this.port = port;
    }

    start() {
        logger.debug("Starting administration server on port %s", this.port);
        
        const app = express();
        const router = express.Router();
        // app.use(cookieParser());
        app.use(bodyParser.json());
        
        router.put('/loglevel', _changeLogLevel)

        app.use('/administration', router);
        
        app.listen(this.port, () => {
            logger.info('Administration server started on port %d!', this.port);
        });
    }
}

export { AdministrationServer };