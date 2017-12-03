import { Component, OnChanges, SimpleChanges, Input } from '@angular/core';
import { LearningModeService } from '../../services/learning-mode.service';
import { RecordedRequest } from '../../model/learning-mode';

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

  constructor(private learningModeService: LearningModeService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.projectName && this.recordedRequestId) {
      this.learningModeService.retrieveRecordedRequest(this.projectName, this.recordedRequestId).subscribe(recordedRequest => {
        this.recordedRequest = recordedRequest;
      });
    }
  }

  onInitResponseBodyEditor(editor) {
    // editor.getAction('editor.action.formatDocument').run();

    const didScrollChangeDisposable = editor.onDidScrollChange(function (event) {
      didScrollChangeDisposable.dispose();
      // console.log(editor)
      // editor.setProperty('readOnly', true)
      editor.getAction('editor.action.formatDocument').run();
    });
  }

}
