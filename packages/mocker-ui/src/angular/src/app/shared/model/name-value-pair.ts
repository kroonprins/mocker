class NameValuePair {
  name: string;
  value: string;

  static newEmpty(): NameValuePair {
    return new NameValuePair();
  }
}

export {
  NameValuePair
};
