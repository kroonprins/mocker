import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project } from '../model/project';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

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

  createProject(project: Project): Observable<Object> { // TODO how empty response handling?
    return this._http.post('http://localhost:3004/api/projects', project);
  }

  updateProject(projectName: string, project: Project): Observable<Object> {
    return this._http.put(`http://localhost:3004/api/projects/${projectName}`, project);
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
