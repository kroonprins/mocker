import { Component, OnInit, Input} from '@angular/core';
import { FixedLatency, RandomLatency } from '../model/latency';

@Component({
  selector: 'app-latency',
  templateUrl: './latency.component.html',
  styleUrls: ['./latency.component.sass']
})
export class LatencyComponent implements OnInit {

  @Input()
  item: object; // TODO make interface
  @Input()
  label: string;
  @Input()
  readonly: boolean;

  latencyType: string;

  constructor() { }

  ngOnInit() {
    if ('fixedLatency' in this.item) {
      this.latencyType = 'fixed';
    } else if ('randomLatency' in this.item) {
      this.latencyType = 'random';
    }
  }

  changeLatencyType(): void {
    if (!this.latencyType) {
      delete this.item['fixedLatency'];
      delete this.item['randomLatency'];
    } else {
      if (this.latencyType === 'fixed') {
        delete this.item['randomLatency'];
        this.item['fixedLatency'] = new FixedLatency();
      } else if (this.latencyType === 'random') {
        delete this.item['fixedLatency'];
        this.item['randomLatency'] = new RandomLatency();
      }
    }
  }

}
