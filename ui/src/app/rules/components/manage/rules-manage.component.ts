import { Component, OnInit, Input, OnChanges, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { ActionType } from '../../model/typedef';
import { RulesService } from '../../services/rules.service';
import { ProjectRule, ResponseHeader, ResponseCookie } from '../../model/project-rule';

@Component({
  selector: 'app-rules-manage',
  templateUrl: './rules-manage.component.html',
  styleUrls: ['./rules-manage.component.sass']
})
export class RulesManageComponent implements OnChanges {

  @Input()
  actionType: ActionType;
  @Input()
  projectName: string;
  @Input()
  ruleName: string;

  @Output()
  onRuleActionCompleted = new EventEmitter<ProjectRule>();

  projectRule: ProjectRule;
  selectedRuleBeforeCreate: ProjectRule;
  ruleNameBeforeUpdate: string;
  monacoEditorOptions: object;
  newHeader: ResponseHeader;
  newCookie: ResponseCookie;

  constructor(private rulesService: RulesService) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.newHeader = ResponseHeader.newEmpty();
    this.newCookie = ResponseCookie.newEmpty();
    switch (this.actionType) {
      case 'consult':
      case 'update':
      case 'duplicate':
        if (this.ruleName) {
          this.rulesService.retrieveProjectRule(this.projectName, this.ruleName).subscribe(projectRule => {
            this.projectRule = projectRule;
            this.ruleNameBeforeUpdate = projectRule.rule.name;
          });
        } else {
          this.projectRule = null;
        }
        break;
      case 'create':
        this.selectedRuleBeforeCreate = this.projectRule;
        this.projectRule = ProjectRule.newEmpty();
        break;
    }
    this.setMonacoEditorSettings();
  }

  private isConsult(): boolean {
    return this.actionType === 'consult';
  }
  private isCreate(): boolean {
    return this.actionType === 'create';
  }
  private isUpdate(): boolean {
    return this.actionType === 'update';
  }
  private isDuplicate(): boolean {
    return this.actionType === 'duplicate';
  }
  private isDelete(): boolean {
    return this.actionType === 'delete';
  }

  private cancelCreateProjectRule(): void {
    this.onRuleActionCompleted.emit(this.selectedRuleBeforeCreate);
    this.actionType = 'consult';
    this.setMonacoEditorSettings();
  }

  private createProjectRule(): void {
    this.rulesService.createProjectRule(this.projectName, this.projectRule).subscribe((projectRule) => {
      this.onRuleActionCompleted.emit(projectRule);
      this.actionType = 'consult';
    });
  }

  private removeProjectRule(): void {
    this.rulesService.removeProjectRule(this.projectName, this.projectRule).subscribe((projectRule) => {
      this.onRuleActionCompleted.emit(projectRule);
    });
  }

  private startUpdateProjectRule(): void {
    this.actionType = 'update';
    this.setMonacoEditorSettings();
  }

  private startDuplicateProjectRule(): void {
    this.actionType = 'duplicate';
    this.setMonacoEditorSettings();
  }

  private cancelUpdateProjectRule(): void {
    this.actionType = 'consult';
    this.setMonacoEditorSettings();
    this.ngOnChanges(null); // TODO better way to remove any manual changes?
  }

  private updateProjectRule(): void {
    this.rulesService.updateProjectRule(this.projectName, this.ruleNameBeforeUpdate, this.projectRule).subscribe((projectRule) => {
      this.onRuleActionCompleted.emit(projectRule);
      this.actionType = 'consult';
    });
  }

  private cancelDuplicateProjectRule(): void {
    this.actionType = 'consult';
    this.setMonacoEditorSettings();
    this.ngOnChanges(null); // TODO better way to remove any manual changes?
  }

  private duplicateProjectRule(): void {
    this.createProjectRule();
  }

  private setMonacoEditorSettings() {
    this.monacoEditorOptions = {
      language: 'json',
      minimap: {
        enabled: false
      },
      scrollbar: {
        horizontal: 'auto',
        vertical: 'auto'
      },
      readOnly: this.isConsult()
    };
  }

  private addNewHeader(): void {
    const headers = this.projectRule.rule.response.headers || [];
    headers.push(this.newHeader);
    this.newHeader = ResponseHeader.newEmpty();
    this.projectRule.rule.response.headers = headers;
  }

  private removeHeader(index: number) {
    this.projectRule.rule.response.headers.splice(index, 1);
  }

  private addNewCookie(): void {
    const cookies = this.projectRule.rule.response.cookies || [];
    cookies.push(this.newCookie);
    this.newCookie = ResponseCookie.newEmpty();
    this.projectRule.rule.response.cookies = cookies;
  }

  private removeCookie(index: number) {
    this.projectRule.rule.response.cookies.splice(index, 1);
  }

}
