import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Project, MockServer, LearningModeServer } from '../model/project';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { LocalStorage } from 'ngx-webstorage';
import { AppConfigurationService } from '../../shared/services/app-configuration.service';

// TODO move common stuff to something shared
interface ResponseErrorBody {
  msg: string;
  code: string;
  data: object;
  uuid: string;
}

class ResponseError /*extends Error*/ { // TODO for some reason when extending error the override of toString isn't working
  message: string;
  code: string;
  data: object;
  uuid: string;
  constructor(message: string, code: string, data: object, uuid: string) {
    // super(message);
    this.message = message;
    this.code = code;
    this.data = data;
    this.uuid = uuid;
  }

  public toString(): string {
    return `${this.message} (${this.uuid})`;
  }
}

const httpResponseHandler = expectedResponseCode => {
  return response => {
    if ((response.status === 200 && response.body['error']) || response.status === 400) {
      const error = <ResponseErrorBody>response['body'];
      throw new ResponseError(error.msg, error.code, error.data, error.uuid);
    } else if (response.status === expectedResponseCode) {
      return response.body;
    } else {
      throw new Error('Unexpected error response ' + JSON.stringify(response));
    }
  };
};

const serverErrorHandler = error => {
  if (error instanceof HttpErrorResponse) {
    throw new Error('Unexpected error ' + JSON.stringify(error));
  }
  throw error;
};

@Injectable()
export class ProjectsService {

  @LocalStorage()
  public storedActiveProject: Project;

  private projectSelection: BehaviorSubject<Project>;
  private selectedProject: Observable<Project>;

  private apiServerLocation: string;

  constructor(private _http: HttpClient, private appConfigurationService: AppConfigurationService) {
    this.projectSelection = new BehaviorSubject<Project>(this.storedActiveProject);
    this.selectedProject = this.projectSelection.asObservable();
    this.apiServerLocation = this.appConfigurationService.retrieveApiServerLocation();
  }

  listProjects(): Observable<Project[]> {
    return this._http.get(`${this.apiServerLocation}/api/projects?serverStatus=true`, { observe: 'response' })
      .map(httpResponseHandler(200))
      .map(projectList => {
        return projectList.map((item) => {
          const project = new Project(); // TODO is all this actually necessary?
          project.name = item.name;

          const mockServer = new MockServer();
          mockServer.port = item.mockServer.port;
          mockServer.bindAddress = item.mockServer.bindAddress;
          mockServer.status = item.mockServer.status;
          project.mockServer = mockServer;

          const learningModeServer = new LearningModeServer();
          learningModeServer.port = item.learningModeServer.port;
          learningModeServer.bindAddress = item.learningModeServer.bindAddress;
          learningModeServer.status = item.learningModeServer.status;
          learningModeServer.targetHost = item.learningModeServer.targetHost;
          learningModeServer.type = item.learningModeServer.type || 'reverse-proxy';
          project.learningModeServer = learningModeServer;

          return project;
        });
      })
      .catch(serverErrorHandler);
  }

  createProject(project: Project): Observable<Object> {
    return this._http.post(`${this.apiServerLocation}/api/projects`, project, { observe: 'response' })
      .map(httpResponseHandler(201))
      .catch(serverErrorHandler);
  }

  updateProject(projectName: string, project: Project): Observable<Object> {
    return this._http.put(`${this.apiServerLocation}/api/projects/${projectName}`, project, { observe: 'response' })
      .map(httpResponseHandler(200))
      .catch(serverErrorHandler);
  }

  removeProject(project: Project): Observable<Object> {
    return this._http.delete(`${this.apiServerLocation}/api/projects/${project.name}`, { observe: 'response' })
      .map(httpResponseHandler(204))
      .catch(serverErrorHandler);
  }

  selectProject(project: Project): void {
    this.storedActiveProject = project;
    this.projectSelection.next(project);
  }

  getSelectedProject(): Observable<Project> {
    return this.selectedProject;
  }

  getLastSelectedProject(): Project {
    return this.projectSelection.getValue();
  }

  startMockServer(project: Project): Observable<Object> {
    return this._http.post(`${this.apiServerLocation}/api/projects/${project.name}/mock-server`,
      project.mockServer, { observe: 'response' })
      .map(httpResponseHandler(200))
      .catch(serverErrorHandler);
  }

  stopMockServer(project: Project): Observable<Object> {
    return this._http.delete(`${this.apiServerLocation}/api/projects/${project.name}/mock-server`, { observe: 'response' })
      .map(httpResponseHandler(204))
      .catch(serverErrorHandler);
  }

  startLearningModeServer(project: Project): Observable<Object> {
    return this._http.post(`${this.apiServerLocation}/api/projects/${project.name}/learning-mode-server`, project.learningModeServer,
      { observe: 'response' })
      .map(httpResponseHandler(200))
      .catch(serverErrorHandler);
  }

  stopLearningModeServer(project: Project): Observable<Object> {
    return this._http.delete(`${this.apiServerLocation}/api/projects/${project.name}/learning-mode-server`, { observe: 'response' })
      .map(httpResponseHandler(204))
      .catch(serverErrorHandler);
  }

}
