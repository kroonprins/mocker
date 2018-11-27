class Server {
  public port: number;
  public bindAddress: string;
  public status: string;
}

class MockServer extends Server {
}

class LearningModeServer extends Server {
  public type: string;
  public targetHost: string;
}

class Project {
  public name: string;
  public mockServer: MockServer;
  public learningModeServer: LearningModeServer;
  public updateOngoing = false;
  public deleteOngoing = false;
  public showServerDetails: string;
}

export { Project, MockServer, LearningModeServer };

