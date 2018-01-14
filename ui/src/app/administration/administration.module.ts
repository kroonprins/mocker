import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdministrationComponent } from './administration.component';
import { SharedModule } from '../shared/shared.module';
import { AdministrationService } from './services/administration.service';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule
  ],
  declarations: [AdministrationComponent],
  providers: [
    AdministrationService
  ]
})
export class AdministrationModule { }
