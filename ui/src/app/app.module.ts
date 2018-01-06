import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { Ng2Webstorage } from 'ngx-webstorage';

import { ProjectsModule } from './projects/projects.module';
import { RulesModule } from './rules/rules.module';
import { ProjectsService } from './projects/services/projects.service';
import { LearningModeModule } from './learning-mode/learning-mode.module';
import { MonacoEditorModule } from 'ngx-monaco-editor';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ProjectsModule,
    RulesModule,
    LearningModeModule,
    Ng2Webstorage.forRoot({ prefix: 'mocker' }),
    MonacoEditorModule.forRoot({
      defaultOptions: {
        minimap: {
          enabled: false
        },
        scrollbar: {
          horizontal: 'auto',
          vertical: 'auto'
        },
      }
    })
  ],
  providers: [
    ProjectsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
