import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Project } from '../model/project';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { LocalStorage } from 'ngx-webstorage';

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
  throw new Error('Unexpected error ' + JSON.stringify(error));
};

@Injectable()
export class ProjectsService {

  @LocalStorage()
  public storedActiveProject: Project;

  private projectSelection: BehaviorSubject<Project>;
  private selectedProject: Observable<Project>;

  constructor(private _http: HttpClient) {
    this.projectSelection = new BehaviorSubject<Project>(this.storedActiveProject);
    this.selectedProject = this.projectSelection.asObservable();
  }

  listProjects(): Observable<Project[]> {
    return this._http.get<string[]>('http://localhost:3004/api/projects', { observe: 'response' })
      .map(httpResponseHandler(200))
      .map(projectList => {
        return projectList.map((projectName) => {
          const project = new Project();
          project.name = projectName;
          return project;
        });
      })
      .catch(serverErrorHandler);
  }

  createProject(project: Project): Observable<Object> {
    return this._http.post('http://localhost:3004/api/projects', project, { observe: 'response' })
      .map(httpResponseHandler(201))
      .catch(serverErrorHandler);
  }

  updateProject(projectName: string, project: Project): Observable<Object> {
    return this._http.put(`http://localhost:3004/api/projects/${projectName}`, project, { observe: 'response' })
      .map(httpResponseHandler(200))
      .catch(serverErrorHandler);
  }

  removeProject(project: Project): Observable<Object> {
    return this._http.delete(`http://localhost:3004/api/projects/${project.name}`, { observe: 'response' })
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

}
