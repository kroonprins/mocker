import { Component, OnInit } from '@angular/core';
import { Project } from './projects/model/project';
import { ProjectsService } from './projects/services/projects.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
  public activeProject: Project;

  constructor(private projectsService: ProjectsService) {}

  ngOnInit(): void {
    this.projectsService.getSelectedProject().subscribe(project => {
      this.activeProject = project;
    });
  }

  getRulesRouterLink(): string {
    if (!this.activeProject) {
      return;
    }
    return `/projects/${this.activeProject.name}/rules`;
  }
}
