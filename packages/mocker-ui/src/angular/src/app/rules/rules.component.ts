import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectRule } from './model/project-rule';
import { ActionType } from './model/typedef';
import { RulesListComponent } from './components/list/rules-list.component';

@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.sass']
})
export class RulesComponent implements OnInit {

  projectName: string;
  selectedRule: ProjectRule;
  selectedRuleAction: ActionType = 'none';
  selectedRuleName: string;

  @ViewChild(RulesListComponent, { static: true })
  listComponent: RulesListComponent;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.projectName = this.route.snapshot.paramMap.get('projectName');
  }

  projectRuleSelected(projectRule: ProjectRule): void {
    this.selectProjectRule(projectRule);
  }

  selectProjectRule(projectRule: ProjectRule) {
    this.selectedRule = projectRule;
    this.selectedRuleAction = 'consult';
    this.selectedRuleName = projectRule ? this.selectedRule.rule.name : undefined;
  }

  createProjectRule(): void {
    this.selectedRuleAction = 'create';
  }

  ruleActionCompleted(projectRule: ProjectRule) {
    this.listComponent.refresh(projectRule);
  }

}
