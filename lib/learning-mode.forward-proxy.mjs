import { logger } from './logging';

class LearningModeForwardProxyServer {

    constructor(port, targetHost, project) {
        this.port = port;
        this.targetHost = targetHost;
        this.project = project;
    }

    start() {
        logger.debug("Starting learning mode reverse proxy server on port %s for target host '%s'", this.port, this.targetHost);
        throw new Error("Unimplemented");
    }
    stop() {
        logger.debug("Request to stop the learning mode reverse proxy server");
        throw new Error("Unimplemented");
    }

}

export {
    LearningModeForwardProxyServer
}