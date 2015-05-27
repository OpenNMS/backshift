Backshift.namespace('Backshift.Utilities.Url');

Backshift.Utilities.Url = Backshift.Class.create({
  initialize: function (baseUrl) {
    this.url = baseUrl;
    this.paramCount = 0;
  },
  andParam: function (kw, parameter) {
    var sep = this.paramCount > 0 ? "&" : "?";

    if (parameter !== undefined) {
      this.paramCount += 1;
      this.url = this.url + sep + kw + "=" + parameter;
    }

    return this;
  },
  toString: function () {
    return this.url;
  }
});
