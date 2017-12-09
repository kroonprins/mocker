import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LearningModeComponent } from './learning-mode.component';
import { LearningModeService } from './services/learning-mode.service';
import { RecordedRequestsListComponent } from './components/list/recorded-requests-list.component';
import { RecordedRequestsConsultComponent } from './components/consult/recorded-requests-consult.component';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { RulesModule } from '../rules/rules.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RulesModule,
    MonacoEditorModule
  ],
  declarations: [
    LearningModeComponent,
    RecordedRequestsListComponent,
    RecordedRequestsConsultComponent
  ],
  providers: [
    LearningModeService
  ]
})
export class LearningModeModule { }
