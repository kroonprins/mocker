import { ResponseCookie } from '../../shared/model/cookie';
import { NameValuePair } from '../../shared/model/name-value-pair';
import { FixedLatency, RandomLatency } from '../../shared/model/latency';

class Rule {
  name: string;
  request: Request;
  isConditionalResponse = false;
  response: Response;
  conditionalResponse: ConditionalResponse;
}

class Request {
  method: string;
  path: string;
}

class Response {
  templatingEngine: string;
  fixedLatency: FixedLatency;
  randomLatency: RandomLatency;
  contentType: string;
  statusCode: number;
  headers: NameValuePair[] = [];
  cookies: ResponseCookie[] = [];
  body: string;
}

class ConditionalResponse {
  templatingEngine: string;
  response: ConditionalResponseValue[] = [];
}

class ConditionalResponseValue {
  condition: string;
  fixedLatency: FixedLatency;
  randomLatency: RandomLatency;
  contentType: string;
  statusCode: number;
  headers: NameValuePair[] = [];
  cookies: ResponseCookie[] = [];
  body: string;
}

class ProjectRule {
  location: string;
  rule: Rule;

  static newEmpty(): ProjectRule {
    const projectRule =  new ProjectRule();
    const rule = new Rule();
    projectRule.rule = rule;
    const request = new Request();
    rule.request = request;
    const response = new Response();
    rule.response = response;
    return projectRule;
  }
}

export { ProjectRule, Rule, Request, Response, ConditionalResponse, ConditionalResponseValue };

