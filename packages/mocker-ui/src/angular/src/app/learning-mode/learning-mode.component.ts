import { Component, OnInit, ViewChild, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RecordedRequest } from './model/learning-mode';
import { RecordedRequestsListComponent } from './components/list/recorded-requests-list.component';

@Component({
  selector: 'app-learning-mode',
  templateUrl: './learning-mode.component.html',
  styleUrls: ['./learning-mode.component.sass']
})
export class LearningModeComponent implements OnInit {

  projectName: string;
  selectedRecordedRequest: RecordedRequest;
  selectedRecordedRequestId: string;

  @ViewChild(RecordedRequestsListComponent, { static: true })
  listComponent: RecordedRequestsListComponent;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.projectName = this.route.snapshot.paramMap.get('projectName');
  }

  recordedRequestSelected(recordedRequest: RecordedRequest): void {
    this.selectRecordedRequest(recordedRequest);
  }

  selectRecordedRequest(recordedRequest: RecordedRequest): void {
    this.selectedRecordedRequest = recordedRequest;
    this.selectedRecordedRequestId = recordedRequest ? this.selectedRecordedRequest._id : undefined;
  }

  recordedRequestRemoved(recordedRequest: RecordedRequest): void {
    this.listComponent.refresh();
  }

}
