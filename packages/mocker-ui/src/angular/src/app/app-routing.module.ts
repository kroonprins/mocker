import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProjectsComponent } from './projects/projects.component';
import { RulesComponent } from './rules/rules.component';
import { LearningModeComponent } from './learning-mode/learning-mode.component';
import { AdministrationComponent } from './administration/administration.component';

const routes: Routes = [
  { path: '', redirectTo: '/projects', pathMatch: 'full' },
  { path: 'projects', component: ProjectsComponent },
  { path: 'projects/:projectName/rules', component: RulesComponent }, // TODO put this one and the next one in module specific child router?
  { path: 'projects/:projectName/learning-mode', component: LearningModeComponent },
  { path: 'administration', component: AdministrationComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
