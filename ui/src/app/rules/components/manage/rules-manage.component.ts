import { Component, OnInit, Input, OnChanges, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { ActionType } from '../../model/typedef';
import { RulesService } from '../../services/rules.service';
import { ProjectRule } from '../../model/project-rule';

@Component({
  selector: 'app-rules-manage',
  templateUrl: './rules-manage.component.html',
  styleUrls: ['./rules-manage.component.sass']
})
export class RulesManageComponent implements OnChanges {

  @Input()
  private actionType: ActionType;
  @Input()
  private projectName: string;
  @Input()
  private ruleName: string;

  @Output()
  private onRuleActionCompleted = new EventEmitter<ProjectRule>();

  private projectRule: ProjectRule;
  private ruleNameBeforeUpdate: string;

  constructor(private rulesService: RulesService) { }

  ngOnChanges(changes: SimpleChanges): void {
    switch (this.actionType) {
      case 'consult':
      case 'update':
        if (this.ruleName) {
          this.rulesService.retrieveProjectRule(this.projectName, this.ruleName).subscribe(projectRule => {
            this.projectRule = projectRule;
            this.ruleNameBeforeUpdate = projectRule.rule.name;
          });
        }
        break;
      case 'create':
        this.projectRule = ProjectRule.newEmpty();
        break;
    }
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
  private isDelete(): boolean {
    return this.actionType === 'delete';
  }

  private createProjectRule(): void {
    this.rulesService.createProjectRule(this.projectName, this.projectRule).subscribe((projectRule) => {
      this.onRuleActionCompleted.emit(projectRule);
    });
  }

  private removeProjectRule(): void {
    this.rulesService.removeProjectRule(this.projectName, this.projectRule).subscribe((projectRule) => {
      this.onRuleActionCompleted.emit(projectRule);
    });
  }

  private startUpdateProjectRule(): void {
    this.actionType = 'update';
  }

  private updateProjectRule(): void {
    this.rulesService.updateProjectRule(this.projectName, this.ruleNameBeforeUpdate, this.projectRule).subscribe((projectRule) => {
      this.onRuleActionCompleted.emit(projectRule);
      this.actionType = 'consult';
    });
  }

}
