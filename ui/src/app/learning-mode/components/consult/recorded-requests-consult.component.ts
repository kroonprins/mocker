import { Component, OnChanges, SimpleChanges, Input } from '@angular/core';
import { LearningModeService } from '../../services/learning-mode.service';
import { RecordedRequest } from '../../model/learning-mode';
import { ProjectRule } from '../../../rules/model/project-rule';

@Component({
  selector: 'app-recorded-requests-consult',
  templateUrl: './recorded-requests-consult.component.html',
  styleUrls: ['./recorded-requests-consult.component.sass']
})
export class RecordedRequestsConsultComponent implements OnChanges {

  @Input()
  projectName: string;
  @Input()
  recordedRequestId: string;

  recordedRequest: RecordedRequest;
  monacoEditorOptions = {
    language: 'json',
    minimap: {
      enabled: false
    },
    scrollbar: {
      horizontal: 'auto',
      vertical: 'auto'
    },
    readOnly: false // TODO should be true but then the formatting doesn't work
  };

  doCreateProjectRule = false;
  initializedRuleForCreation: ProjectRule;

  constructor(private learningModeService: LearningModeService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.projectName && this.recordedRequestId) {
      this.learningModeService.retrieveRecordedRequest(this.projectName, this.recordedRequestId).subscribe(recordedRequest => {
        this.recordedRequest = recordedRequest;
      });
    }
  }

  onInitResponseBodyEditor(editor): void {
    // TODO find better way to format (this only works first time, not when switching between requests) => maybe use ng2-ace-editor instead
    const didScrollChangeDisposable = editor.onDidScrollChange(function (event) {
      didScrollChangeDisposable.dispose();
      editor.getAction('editor.action.formatDocument').run();
    });
  }

  startCreateProjectRule(): void {
    this.doCreateProjectRule = true;
    this.initializedRuleForCreation = this.learningModeService.recordedRequestToProjectRule(this.recordedRequest);
  }

  createProjectRuleCompleted(): void {
    this.doCreateProjectRule = false;
  }

}
