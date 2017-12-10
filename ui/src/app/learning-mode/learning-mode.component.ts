import { Component, OnInit, ViewChild, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RecordedRequest } from './model/learning-mode';
import { RecordedRequestsListComponent } from './components/list/recorded-requests-list.component';
import { SimpleChange } from '@angular/core/src/change_detection/change_detection_util';

@Component({
  selector: 'app-learning-mode',
  templateUrl: './learning-mode.component.html',
  styleUrls: ['./learning-mode.component.sass']
})
export class LearningModeComponent implements OnInit {

  projectName: string;
  selectedRecordedRequest: RecordedRequest;
  selectedRecordedRequestId: string;

  @ViewChild(RecordedRequestsListComponent)
  listComponent: RecordedRequestsListComponent;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.projectName = this.route.snapshot.paramMap.get('projectName');
  }

  onRecordedRequestSelected(recordedRequest: RecordedRequest): void {
    this.selectRecordedRequest(recordedRequest);
  }

  selectRecordedRequest(recordedRequest: RecordedRequest): void {
    this.selectedRecordedRequest = recordedRequest;
    this.selectedRecordedRequestId = recordedRequest ? this.selectedRecordedRequest._id : undefined;
  }

  onRecordedRequestRemoved(recordedRequest: RecordedRequest): void {
    this.listComponent.refresh();
  }

}
