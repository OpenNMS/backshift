export default class Backshift {
  configure(args) {
    args = args || {};

    const defs = this.defaults();

    Object.keys(defs).forEach((key) => {
      if (defs[key] !== null && typeof defs[key] === 'object') {
        Object.keys(defs[key]).forEach((subkey) => {
          const match = [ args, this, defs ].find((obj) => obj !== undefined && obj[key] !== undefined && obj[key][subkey] !== undefined);
          if (match) {
            this[key][subkey] = match[key][subkey];
          }
        });
      } else {
        const match = [ args, this, defs ].find((obj) => obj !== undefined && obj[key] !== undefined);
        if (match) {
          this[key] = match[key];
        }
      }
    });
  }

  defaults() {
    return {};
  }

  rows(matrix) {
    const ncols = matrix.length;
    if (ncols === 0) {
      return [];
    }
    const nrows = matrix[0].length;
  
    const rows = new Array(nrows);
    for (let i = 0; i < nrows; i++) {
      const row = new Array(ncols);
      for (let j = 0; j < ncols; j++) {
        row[j] = matrix[j][i];
      }
      rows[i] = row;
    }
  
    return rows;      
  }

  fail(msg) {
    console.error(msg);
    throw new Error(msg);
  }

  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
}

window.Backshift = Backshift;