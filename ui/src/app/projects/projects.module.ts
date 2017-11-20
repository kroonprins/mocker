import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsComponent } from './projects.component';
import { ProjectsService } from './services/projects.service';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    ProjectsComponent
  ],
  declarations: [
    ProjectsComponent,
  ],
  providers: [
    // ProjectsService
  ]
})
export class ProjectsModule { }
