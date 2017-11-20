class Rule {
  name: string;
  request: Request;
  response: Response;
}

class Request {
  method: string;
  path: string;
}

class Response {
  templatingEngine: string; // TODO enum? (enum = type?)
  contentType: string;
  statusCode: number;
  headers: ResponseHeader[] = [];
  cookies: ResponseCookie[] = [];
  body: string;
}

class ResponseHeader {
  name: string;
  value: string;
}

class ResponseCookie {
  name: string;
  value: string;
  properties: object;
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

export { ProjectRule, Rule, Request, Response, ResponseHeader, ResponseCookie };

