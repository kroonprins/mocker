import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RulesComponent } from './rules.component';
import { RulesListComponent } from './components/list/rules-list.component';
import { RulesService } from './services/rules.service';
import { RulesManageComponent } from './components/manage/rules-manage.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    RulesComponent
  ],
  declarations: [
    RulesComponent,
    RulesListComponent,
    RulesManageComponent
  ],
  providers: [
    RulesService
  ]
})
export class RulesModule { }
