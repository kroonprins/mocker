
const ENVIRONMENT_VARIABLES = process.env;

// TODO split config?
class Config {
    constructor() {
        // TODO add optional bind ip
        this.mockServerPort = ENVIRONMENT_VARIABLES.MOCKER_MOCK_SERVER_PORT || 3000;
        this.administrationServerPort = ENVIRONMENT_VARIABLES.MOCKER_ADMINISTRATION_SERVER_PORT || 3001;
        this.learningModeReverseProxyServerPort = ENVIRONMENT_VARIABLES.MOCKER_LEARNING_MODE_REVERSE_PROXY_SERVER_PORT || 3002;
        this.learningModeForwardProxyServerPort = ENVIRONMENT_VARIABLES.MOCKER_LEARNING_MODE_FORWARD_PROXY_SERVER_PORT || 3003;

        this.project = ENVIRONMENT_VARIABLES.MOCKER_PROJECT;
        if(!this.project) {
            throw new Error("The environment variable MOCKER_PROJECT must be set to run the mock server");
        }

        this.projectsFileLocation = ENVIRONMENT_VARIABLES.MOCKER_PROJECTS_FILE || './projects/projects.yaml';

        this.startupLogLevel = ENVIRONMENT_VARIABLES.MOCKER_LOG_LEVEL || 'info';

        this.learningModeDb = ENVIRONMENT_VARIABLES.MOCKER_LEARNING_MODE_DB || './data/learning_mode.db'
    }

}

const config = new Config();

export {
    config
}