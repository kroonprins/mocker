import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Project } from '../model/project';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

// TODO move to something shared
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

@Injectable()
export class ProjectsService {

  // TODO move the project selection to a shared service?
  private projectSelection: BehaviorSubject<Project> = new BehaviorSubject<Project>(new Project());
  private selectedProject: Observable<Project>;

  constructor(private _http: HttpClient) {
    this.selectedProject = this.projectSelection.asObservable();
  }

  listProjects(): Observable<Project[]> {
    return this._http.get<string[]>('http://localhost:3004/api/projects').map((projectsList) => {
      return projectsList.map((projectName) => {
        const project = new Project();
        project.name = projectName;
        return project;
      });
    });
  }

  // TODO way to handle this in more generic way for all http calls
  // (difference between create/update can be handled in general way (statusCode >=200 <300))
  createProject(project: Project): Observable<Object> {
    return this._http.post('http://localhost:3004/api/projects', project, { observe: 'response' })
      .map(response => {
        if (response.status === 201) {
          return null;
        } else if ((response.status === 200 && response.body['error']) || response.status === 400) {
          const error = <ResponseErrorBody>response['body'];
          throw new ResponseError(error.msg, error.code, error.data, error.uuid);
        } else {
          throw new Error('Unexpected error when trying to create project ' + JSON.stringify(response));
        }
      })
      .catch(error => {
        if (error instanceof HttpErrorResponse) {
          throw new Error('Unexpected error when trying to create project ' + JSON.stringify(error));
        }
        throw error;
      });
  }

  updateProject(projectName: string, project: Project): Observable<Object> {
    return this._http.put(`http://localhost:3004/api/projects/${projectName}`, project, { observe: 'response' }).map(response => {
      if ((response.status === 200 && response.body['error']) || response.status === 400) {
        const error = <ResponseErrorBody>response['body'];
        throw new ResponseError(error.msg, error.code, error.data, error.uuid);
      } else if (response.status === 200) {
        return response.body;
      } else {
        throw new Error('Unexpected error when trying to create project ' + JSON.stringify(response));
      }
    })
      .catch(error => {
        if (error instanceof HttpErrorResponse) {
          throw new Error('Unexpected error when trying to create project ' + JSON.stringify(error));
        }
        throw error;
      });
  }

  removeProject(project: Project): Observable<Object> {
    return this._http.delete(`http://localhost:3004/api/projects/${project.name}`);
  }

  selectProject(project: Project): void {
    this.projectSelection.next(project);
  }

  getSelectedProject(): Observable<Project> {
    return this.selectedProject;
  }

  getLastSelectedProject(): Project {
    return this.projectSelection.getValue();
  }

}
