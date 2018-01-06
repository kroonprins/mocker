import { Component, OnChanges, SimpleChanges, Input, EventEmitter, Output } from '@angular/core';
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

  @Output()
  recordedRequestRemoved = new EventEmitter<RecordedRequest>();

  recordedRequest: RecordedRequest;
  monacoEditorOptions = {
    language: 'json',
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
    } else {
      this.recordedRequest = null;
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

  removeRecordedRequest(): void {
    this.learningModeService.removeRecordedRequest(this.projectName, this.recordedRequestId).subscribe(recordedRequest => {
      this.recordedRequestRemoved.emit(this.recordedRequest);
    });
  }

}
