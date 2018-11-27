import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsComponent } from './projects.component';
import { ProjectsService } from './services/projects.service';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule
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
