import { Component, OnChanges, Input, Output, SimpleChanges, EventEmitter } from '@angular/core';
import { ConfigDropdownService } from '../services/config-dropdown.service';
@Component({
  selector: 'app-config-dropdown',
  templateUrl: './config-dropdown.component.html',
  styleUrls: ['./config-dropdown.component.sass']
})
export class ConfigDropdownComponent implements OnChanges {

  @Input()
  configItem: string;
  @Input()
  readonly: boolean;

  @Input()
  value: string;
  @Output()
  valueChange = new EventEmitter<string>();

  items: string[];

  constructor(private _configDropdownService: ConfigDropdownService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if ('configItem' in changes) {
      this._configDropdownService.retrieveConfigItem(this.configItem).subscribe(response =>
        this.items = response['value']
      );
    }
  }

  selectItem(selectedValue: string): void {
    this.valueChange.emit(selectedValue);
  }

}
