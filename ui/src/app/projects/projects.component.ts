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

  constructor(private projectsService: ProjectsService) { }

  ngOnInit(): void {
    this.projectsService.listProjects().subscribe(projects => {
        this.projects = projects;
      });
    this.newProject = new Project();
    this.updatedProject = new Project();
  }

  selectProject(project: Project): void {
    this.projectsService.selectProject(project);
  }

  createNewProject(): void {
    this.projectsService.createProject(this.newProject).subscribe(_ => {
      this.ngOnInit();
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
    this.projectsService.updateProject(projectToUpdate.name, this.updatedProject).subscribe(_ => {
      if (projectToUpdate.name === this.projectsService.getLastSelectedProject().name) {
        this.projectsService.selectProject(this.updatedProject);
      }
      this.ngOnInit();
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
