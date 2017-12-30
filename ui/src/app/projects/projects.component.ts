import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ProjectsService } from './services/projects.service';
import { Project } from './model/project';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.sass']
})
export class ProjectsComponent implements OnInit {

  projects: Project[];
  newProject: Project;
  updatedProject: Project;
  learningModeServerTypes: string[];

  listProjectProjectFailed: boolean;
  listProjectProjectFailedUserMessage: string;
  createNewProjectFailed: boolean;
  createNewProjectFailedUserMessage: string;
  updateOrDeleteProjectFailed: boolean;
  updateOrDeleteProjectFailedUserMessage: string;
  serverActionFailed: boolean;
  serverActionFailedUserMessage: string;

  constructor(private projectsService: ProjectsService) { }

  ngOnInit(): void {
    // TODO cache list of projects in service? because not necessary to always retrieve from server
    this.listProjectProjectFailed = false;
    this.projectsService.listProjects().subscribe(projects => {
      this.projects = projects;
    }, error => {
      this.listProjectProjectFailed = true;
      this.listProjectProjectFailedUserMessage = error.toString();
    });
    if (!this.learningModeServerTypes) {
      this.projectsService.listLearningModeServerTypes().subscribe(response => {
        this.learningModeServerTypes = response['value'];
      });
    }
    this.newProject = new Project();
    this.updatedProject = new Project();
    this.createNewProjectFailed = false;
    this.updateOrDeleteProjectFailed = false;
    this.serverActionFailed = false;
  }

  selectProject(project: Project): void {
    this.projectsService.selectProject(project);
  }

  createNewProject(): void {
    this.createNewProjectFailed = false;
    this.projectsService.createProject(this.newProject).subscribe(_ => {
      this.ngOnInit();
    }, error => {
      this.createNewProjectFailed = true;
      this.createNewProjectFailedUserMessage = error.toString();
    });
  }

  startProjectUpdate(projectToUpdate: Project) {
    this.updateOrDeleteProjectFailed = false;
    this.updatedProject.name = projectToUpdate.name;
    projectToUpdate.updateOngoing = true;
  }

  cancelProjectUpdate(projectToUpdate: Project) {
    this.updatedProject = new Project();
    projectToUpdate.updateOngoing = false;
  }

  updateProject(projectToUpdate: Project): void {
    this.updateOrDeleteProjectFailed = false;
    this.projectsService.updateProject(projectToUpdate.name, this.updatedProject).subscribe(respo => {
      if (projectToUpdate.name === this.projectsService.getLastSelectedProject().name) {
        this.projectsService.selectProject(this.updatedProject);
      }
      this.ngOnInit();
    }, error => {
      this.updateOrDeleteProjectFailed = true;
      this.updateOrDeleteProjectFailedUserMessage = error.toString();
    });
  }

  removeProject(project: Project): void {
    project.deleteOngoing = true;
    this.updateOrDeleteProjectFailed = false;
    if (project.name === this.projectsService.getLastSelectedProject().name) {
      this.projectsService.selectProject(new Project());
    }
    this.projectsService.removeProject(project).subscribe(_ => {
      this.ngOnInit();
    }, error => {
      this.updateOrDeleteProjectFailed = true;
      this.updateOrDeleteProjectFailedUserMessage = error.toString();
    });
  }

  toggleMockServerDetails(project: Project): void {
    project.showServerDetails = project.showServerDetails !== 'mockServer' ? 'mockServer' : undefined;
  }

  startMockServer(project: Project): void {
    this.projectsService.startMockServer(project).subscribe(response => {
      this.ngOnInit();
    }, error => {
      this.serverActionFailed = true;
      this.serverActionFailedUserMessage = error.toString();
    });
  }

  stopMockServer(project: Project): void {
    this.projectsService.stopMockServer(project).subscribe(response => {
      this.ngOnInit();
    }, error => {
      this.serverActionFailed = true;
      this.serverActionFailedUserMessage = error.toString();
    });
  }

  toggleLearningModeServerDetails(project: Project): void {
    project.showServerDetails = project.showServerDetails !== 'learningModeServer' ? 'learningModeServer' : undefined;
  }

  startLearningModeServer(project: Project): void {
    this.projectsService.startLearningModeServer(project).subscribe(response => {
      this.ngOnInit();
    }, error => {
      this.serverActionFailed = true;
      this.serverActionFailedUserMessage = error.toString();
    });
  }

  stopLearningModeServer(project: Project): void {
    this.projectsService.stopLearningModeServer(project).subscribe(response => {
      this.ngOnInit();
    }, error => {
      this.serverActionFailed = true;
      this.serverActionFailedUserMessage = error.toString();
    });
  }

}
