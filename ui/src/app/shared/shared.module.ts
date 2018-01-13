import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigDropdownComponent } from './components/config-dropdown.component';
import { ConfigDropdownService } from './services/config-dropdown.service';
import { FormsModule } from '@angular/forms';
import { CookiesComponent } from './components/cookies.component';
import { NameValuePairsComponent } from './components/name-value-pairs.component';
import { AppConfigurationService } from './services/app-configuration.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    ConfigDropdownComponent,
    CookiesComponent,
    NameValuePairsComponent
  ],
  declarations: [ConfigDropdownComponent, CookiesComponent, NameValuePairsComponent],
  providers: [
    ConfigDropdownService,
    AppConfigurationService
  ]
})
export class SharedModule { }
