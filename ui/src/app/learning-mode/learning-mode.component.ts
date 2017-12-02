import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RecordedRequest } from './model/learning-mode';

@Component({
  selector: 'app-learning-mode',
  templateUrl: './learning-mode.component.html',
  styleUrls: ['./learning-mode.component.sass']
})
export class LearningModeComponent implements OnInit {

  projectName: string;
  selectedRecordedRequest: RecordedRequest;
  selectedRecordedRequestId: string;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.projectName = this.route.snapshot.paramMap.get('projectName');
  }

  onRecordedRequestSelected(recordedRequest: RecordedRequest): void {
    this.selectRecordedRequest(recordedRequest);
  }

  selectRecordedRequest(recordedRequest: RecordedRequest) {
    this.selectedRecordedRequest = recordedRequest;
    this.selectedRecordedRequestId = recordedRequest ? this.selectedRecordedRequest._id : undefined;
  }

}
