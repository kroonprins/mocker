class Cookie {
  name: string;
  value: string;

  static newEmpty(): Cookie {
    return new Cookie();
  }
}

class ResponseCookie extends Cookie {
  properties: object;
  showProperties: boolean;

  static newEmpty(): ResponseCookie {
    const responseCookie =  new ResponseCookie();
    responseCookie.properties = {};
    responseCookie.showProperties = false;
    return responseCookie;
  }
}

export {
  Cookie,
  ResponseCookie
};

