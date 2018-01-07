import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigDropdownComponent } from './components/config-dropdown.component';
import { ConfigDropdownService } from './services/config-dropdown.service';
import { FormsModule } from '@angular/forms';
import { CookiesComponent } from './components/cookies.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    ConfigDropdownComponent,
    CookiesComponent
  ],
  declarations: [ConfigDropdownComponent, CookiesComponent],
  providers: [
    ConfigDropdownService
  ]
})
export class SharedModule { }
