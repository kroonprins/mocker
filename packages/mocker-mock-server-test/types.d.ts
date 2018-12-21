declare module "@kroonprins/mocker-mock-server-test/cjs/exports" {
  export interface Request {
    method: string,
    path: string
  }
  export interface FixedLatency {
    value: number
  }
  export interface RandomLatency {
    min?: number,
    max: number
  }
  export interface Header {
    name: string
    value: string
  }
  export interface CookieProperty {
    domain?: string
    expires?: Date
    httpOnly?: boolean
    maxAge?: number
    path?: string
    secure?: boolean
    signed?: boolean
    sameSite?: boolean | string
  }
  export interface Cookie {
    name: string
    value: string
    properties: CookieProperty
  }
  export interface Response {
    templatingEngine: string,
    fixedLatency?: FixedLatency
    randomLatency?: RandomLatency
    contentType?: string
    statusCode: number
    headers?: Header[]
    cookies?: Cookie[]
    body?: string
  }
  export interface ConditionalResponse {
    templatingEngine: string,
    response: ConditionalResponseValue
  }
  export interface ConditionalResponseValue {
    condition: boolean | string
    fixedLatency?: FixedLatency
    randomLatency?: RandomLatency
    contentType?: string
    statusCode: number
    headers: Header[]
    cookies: Cookie[]
    body?: string
  }
  export interface Rule {
    name?: string,
    request: Request,
    response?: Response
    ConditionalResponse?: ConditionalResponse
  }
  export interface MockServerOpts {
    port: number
    ruleLocation?: string | string[],
    rule?: Rule | Rule[]
  }

  export interface GlobalMetrics {
    invocations (): number
  }
  export interface Metrics {
    invocations (): number
    ruleName (): string
    ruleLocation (): string
    path (): string
    fullPath (): string
    header (name: string): string
    query (name: string): string
    cookie (name: string): string
    body (): string
  }

  export class MockServer {
    constructor(opts: MockServerOpts)

    port: number

    start (): Promise<void>
    stop (): Promise<void>

    global (): GlobalMetrics
    for (path: string, method: string): Metrics
    name (name: string): Metrics
  }
}
