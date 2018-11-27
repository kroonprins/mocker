import { Component, OnInit, Input } from '@angular/core';
import { NameValuePair } from '../model/name-value-pair';

@Component({
  selector: 'app-name-value-pairs',
  templateUrl: './name-value-pairs.component.html',
  styleUrls: ['./name-value-pairs.component.sass']
})
export class NameValuePairsComponent implements OnInit {

  @Input()
  nameValuePairs: NameValuePair[];
  @Input()
  label: string;
  @Input()
  readonly: boolean;

  newNameValuePair: NameValuePair;

  constructor() { }

  ngOnInit() {
    this.newNameValuePair = NameValuePair.newEmpty();
  }

  private addNewNameValuePair(): void {
    const nameValuePairs = this.nameValuePairs || [];
    nameValuePairs.push(this.newNameValuePair);
    this.newNameValuePair = NameValuePair.newEmpty();
    this.nameValuePairs = nameValuePairs;
  }

  private removeNameValuePair(index: number) {
    this.nameValuePairs.splice(index, 1);
  }

}
