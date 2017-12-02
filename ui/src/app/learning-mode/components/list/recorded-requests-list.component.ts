import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { RecordedRequest } from '../../model/learning-mode';
import { LearningModeService } from '../../services/learning-mode.service';

@Component({
  selector: 'app-recorded-requests-list',
  templateUrl: './recorded-requests-list.component.html',
  styleUrls: ['./recorded-requests-list.component.sass']
})
export class RecordedRequestsListComponent implements OnChanges {

  @Input()
  projectName: string;
  @Input()
  selectedRecordedRequestId: string;

  @Output()
  onRecordedRequestSelected = new EventEmitter<RecordedRequest>();

  recordedRequests: RecordedRequest[];

  constructor(private learningModeService: LearningModeService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if ('projectName' in changes) {
      this.learningModeService.listRecordedRequests(this.projectName).subscribe(recordedRequests => {
        this.recordedRequests = recordedRequests;
        this.findRecordedRequestToSelect();
      });
    } else {
      this.findRecordedRequestToSelect();
    }
  }

  private findRecordedRequestToSelect(): void {
    if (this.selectedRecordedRequestId) {
      this.selectRecordedRequest(this.recordedRequests.find(recordedRequest => {
        return recordedRequest._id === this.selectedRecordedRequestId;
      }));
    } else {
      this.selectRecordedRequest();
    }
  }

  selectRecordedRequest(recordedRequest?): void {
    if (!RecordedRequest && this.recordedRequests.length > 0) {
      this.onRecordedRequestSelected.emit(this.recordedRequests[0]);
    } else {
      this.onRecordedRequestSelected.emit(recordedRequest);
    }
  }

}
