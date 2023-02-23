import Backshift from './Backshift';

class Url extends Backshift {
  constructor(baseUrl) {
    super();
    this.url = baseUrl;
    this.paramCount = 0;
  }

  andParam(kw, parameter) {
    var sep = this.paramCount > 0 ? "&" : "?";

    if (parameter !== undefined) {
      this.paramCount += 1;
      this.url = this.url + sep + kw + "=" + parameter;
    }

    return this;
  }
  toString() {
    return this.url;
  }
}

Backshift.Utilities.Url = Url;
export default Url;