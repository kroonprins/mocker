import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigDropdownComponent } from './components/config-dropdown.component';
import { ConfigDropdownService } from './services/config-dropdown.service';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    ConfigDropdownComponent
  ],
  declarations: [ConfigDropdownComponent],
  providers: [
    ConfigDropdownService
  ]
})
export class SharedModule { }
