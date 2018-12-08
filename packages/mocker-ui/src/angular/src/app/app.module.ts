import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { Ng2Webstorage } from 'ngx-webstorage';

import { ProjectsModule } from './projects/projects.module';
import { RulesModule } from './rules/rules.module';
import { ProjectsService } from './projects/services/projects.service';
import { LearningModeModule } from './learning-mode/learning-mode.module';
import { AdministrationModule } from './administration/administration.module';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { SharedModule } from './shared/shared.module';
import { AppConfigurationService } from './shared/services/app-configuration.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    SharedModule,
    ProjectsModule,
    RulesModule,
    LearningModeModule,
    AdministrationModule,
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
    }),
    FontAwesomeModule
  ],
  providers: [
    {
      'provide': APP_INITIALIZER,
      'useFactory': (configurationService: AppConfigurationService) => () => configurationService.initializeAppConfiguration(),
      'deps': [ AppConfigurationService ],
      'multi': true,
    },
    ProjectsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
