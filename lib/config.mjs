
const ENVIRONMENT_VARIABLES = process.env;

class Config {
    constructor() {
        this.mockServerPort = ENVIRONMENT_VARIABLES.MOCKER_MOCK_SERVER_PORT || 3000;
        this.administrationServerPort = ENVIRONMENT_VARIABLES.MOCKER_ADMINISTRATION_SERVER_PORT || 3001;

        this.project = ENVIRONMENT_VARIABLES.MOCKER_PROJECT;
        if(!this.project) {
            throw new Error("The environment variable MOCKER_PROJECT must be set to run the mock server");
        }

        this.projectsFileLocation = ENVIRONMENT_VARIABLES.MOCKER_PROJECTS_FILE || './projects/projects.yaml';

        this.startupLogLevel = ENVIRONMENT_VARIABLES.MOCKER_LOG_LEVEL || 'info';
    }

}

const config = new Config();

export { config };