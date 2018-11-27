import { Component, OnInit, Input } from '@angular/core';
import { Cookie, ResponseCookie } from '../model/cookie';

@Component({
  selector: 'app-cookies',
  templateUrl: './cookies.component.html',
  styleUrls: ['./cookies.component.sass']
})
export class CookiesComponent implements OnInit {

  @Input()
  cookies: Cookie[];
  @Input()
  label: string;
  @Input()
  readonly: boolean;
  @Input()
  isResponseCookie = false;

  newCookie: Cookie;
  newResponseCookie: ResponseCookie;

  constructor() { }

  ngOnInit() {
    this.newCookie = Cookie.newEmpty();
    this.newResponseCookie = ResponseCookie.newEmpty();
  }

  private toggleCookieProperties(cookie: ResponseCookie) {
    cookie.showProperties = !cookie.showProperties;
  }

  private removeCookie(index: number) {
    this.cookies.splice(index, 1);
  }

  private addNewCookie(): void {
    const cookies = this.cookies || [];
    cookies.push(this.newCookie);
    this.newCookie = Cookie.newEmpty();
    this.cookies = cookies;
  }

  private addNewResponseCookie(): void {
    const cookies = this.cookies || [];
    this.newResponseCookie.showProperties = false;
    cookies.push(this.newResponseCookie);
    this.newResponseCookie = ResponseCookie.newEmpty();
    this.cookies = cookies;
  }
}
