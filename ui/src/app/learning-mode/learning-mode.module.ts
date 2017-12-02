import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LearningModeComponent } from './learning-mode.component';
import { LearningModeService } from './services/learning-mode.service';
import { RecordedRequestsListComponent } from './components/list/recorded-requests-list.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    LearningModeComponent,
    RecordedRequestsListComponent
  ],
  providers: [
    LearningModeService
  ]
})
export class LearningModeModule { }
