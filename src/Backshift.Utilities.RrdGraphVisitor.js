Backshift.namespace('Backshift.Utilities.RrdGraphConverter');

Backshift.Utilities.RrdGraphVisitor  = Backshift.Class.create( {
  initialize: function(args) {
    this.onInit(args);
  },

  onInit: function(args) {
    // Defined by subclasses
  },

  _visit: function(graphDef) {
    // Inspired from http://krasimirtsonev.com/blog/article/Simple-command-line-parser-in-JavaScript
    var CommandLineParser = (function() {
        var parse = function(str, lookForQuotes) {
          var args = [];
          var readingPart = false;
          var part = '';
          var n = str.length;
          for(var i=0; i < n; i++) {
          if(str.charAt(i) === ' ' && !readingPart) {
            args.push(part);
            part = '';
            } else {
            if(str.charAt(i) === '\"' && lookForQuotes) {
              readingPart = !readingPart;
              part += str.charAt(i);
            } else {
              part += str.charAt(i);
            }
          }
        }
        args.push(part);
        return args;
      };
      return {
        parse: parse
      }
    })();

    var i, args, command, name, path, dsName, consolFun, rpnExpression, subParts, width, srcName, color, legend;
    var parts = CommandLineParser.parse(graphDef.command, true);
    var n = parts.length;
    for (i = 0; i < n; i++) {
      if (parts[0].indexOf("--") === 0) {
        args = /--(.*)=(.*)/.exec(parts[0]);

        if (args[1] === "title") {
          this._onTitle(this._displayString(args[2]));
        }
      }

      args = parts[i].split(":");
      command = args[0];

      if (command === "DEF") {
        subParts = args[1].split("=");
        name = subParts[0];
        path = subParts[1];
        dsName = args[2];
        consolFun = args[3];
        this._onDEF(name, path, dsName, consolFun);
      } else if (command === "CDEF") {
        subParts = args[1].split("=");
        name = subParts[0];
        rpnExpression = subParts[1];
        this._onCDEF(name, rpnExpression);
      } else if (command.match(/LINE/)) {
        width = parseInt(/LINE(\d+)/.exec(command));
        subParts = args[1].split("#");
        srcName = subParts[0];
        color = '#' + subParts[1];
        legend = this._displayString(args[2]);
        this._onLine(srcName, color, legend, width);
      } else if (command === "AREA") {
        subParts = args[1].split("#");
        srcName = subParts[0];
        color = '#' + subParts[1];
        legend = this._displayString(args[2]);
        this._onArea(srcName, color, legend);
      } else if (command === "STACK") {
        subParts = args[1].split("#");
        srcName = subParts[0];
        color = '#' + subParts[1];
        legend = this._displayString(args[2]);
        this._onStack(srcName, color, legend);
      }
    }
  },
  _onTitle: function(title) {

  },
  _onDEF: function(name, path, dsName, consolFun) {

  },
  _onCDEF: function(name, rpnExpression) {

  },
  _onLine: function(srcName, color, legend, width) {

  },
  _onArea: function(srcName, color, legend) {

  },
  _onStack: function(srcName, color, legend) {

  },
  _displayString: function(string) {
    if (string === undefined) {
      return string;
    }
    // Remove any quotes
    string = string.replace(/"/g, '');
    // Remove any newlines
    string = string.replace("\\n", '');
    // Remove trailing slashes
    string = string.replace(/(.*)(\\)/, '$1');
    // Remove any leading/trailing whitespace
    string = string.trim();
    return string;
  }
} );
