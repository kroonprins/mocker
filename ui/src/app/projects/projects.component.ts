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
  createNewProjectFailed: boolean;
  createNewProjectFailedUserMessage: string;
  updateProjectFailed: boolean;
  updateProjectFailedUserMessage: string;

  constructor(private projectsService: ProjectsService) { }

  ngOnInit(): void {
    this.projectsService.listProjects().subscribe(projects => {
        this.projects = projects;
      });
    this.newProject = new Project();
    this.updatedProject = new Project();
    this.createNewProjectFailed = false;
    this.updateProjectFailed = false;
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
    this.updatedProject.name = projectToUpdate.name;
    projectToUpdate.updateOngoing = true;
  }

  cancelProjectUpdate(projectToUpdate: Project) {
    this.updatedProject = new Project();
    projectToUpdate.updateOngoing = false;
  }

  updateProject(projectToUpdate: Project): void {
    this.updateProjectFailed = false;
    this.projectsService.updateProject(projectToUpdate.name, this.updatedProject).subscribe(respo => {
      if (projectToUpdate.name === this.projectsService.getLastSelectedProject().name) {
        this.projectsService.selectProject(this.updatedProject);
      }
      this.ngOnInit();
    }, error => {
      this.updateProjectFailed = true;
      this.updateProjectFailedUserMessage = error.toString();
    });
  }

  removeProject(project: Project): void {
    if (project.name === this.projectsService.getLastSelectedProject().name) {
      this.projectsService.selectProject(new Project());
    }
    this.projectsService.removeProject(project).subscribe(_ => {
      this.ngOnInit();
    });
  }

}
