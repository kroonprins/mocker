import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RulesComponent } from './rules.component';
import { RulesListComponent } from './components/list/rules-list.component';
import { RulesService } from './services/rules.service';
import { RulesManageComponent } from './components/manage/rules-manage.component';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MonacoEditorModule
  ],
  exports: [
    RulesComponent, // TODO needs to be exported?
    RulesManageComponent
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
