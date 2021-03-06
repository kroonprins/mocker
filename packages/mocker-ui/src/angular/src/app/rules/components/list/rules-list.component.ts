import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { RulesService } from '../../services/rules.service';
import { ProjectRule } from '../../model/project-rule';

@Component({
  selector: 'app-rules-list',
  templateUrl: './rules-list.component.html',
  styleUrls: ['./rules-list.component.sass']
})
export class RulesListComponent implements OnChanges {

  @Input()
  projectName: string;
  @Input()
  selectedProjectRuleName: string;

  @Output()
  projectRuleSelected = new EventEmitter<ProjectRule>();

  projectRules: ProjectRule[];

  constructor(private ruleService: RulesService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if ('projectName' in changes) {
      this.refresh();
    } else {
      this.findProjectRuleToSelect();
    }
  }

  refresh(projectRule?: ProjectRule): void {
    this.ruleService.listProjectRules(this.projectName).subscribe(projectRules => {
      this.projectRules = projectRules;
      if (projectRule) {
        this.selectProjectRule(projectRule);
      } else {
        this.findProjectRuleToSelect();
      }
    });
  }

  private findProjectRuleToSelect(): void {
    if (this.selectedProjectRuleName) {
      this.selectProjectRule(this.projectRules.find(projectRule => {
        return projectRule.rule.name === this.selectedProjectRuleName;
      }));
    } else {
      this.selectProjectRule();
    }
  }

  selectProjectRule(projectRule?): void {
    if (!projectRule && this.projectRules.length > 0) {
      this.projectRuleSelected.emit(this.projectRules[0]);
    } else {
      this.projectRuleSelected.emit(projectRule);
    }
  }

}
