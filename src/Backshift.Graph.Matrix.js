/**
 * Created by jwhite on 5/23/14.
 */

Backshift.namespace('Backshift.Graph.Matrix');

/** Draws a table with all of the sources values. */
Backshift.Graph.Matrix = Backshift.Class.create(Backshift.Graph, {

  onInit: function () {
    // Used to hold a reference to the div that holds the status text
    this.statusBlock = null;
  },

  beforeFetch: function () {
    this.timeBeforeFetch = Date.now();
    this.updateStatus("Fetching...");
  },

  onFetchSuccess: function (dp) {
    this.drawMatrix(dp);
    var timeAfterFetch = Date.now();
    var secondsForFetch = Number((timeAfterFetch - this.timeBeforeFetch) / 1000).toFixed(2);
    this.updateStatus("Successfully retrieved data in " + secondsForFetch + " seconds.");
  },

  onFetchFail: function () {
    this.updateStatus("Fetch failed.");
  },

  onNewData: function () {
    this.updateStatus("Received new data!");
  },

  updateStatus: function (status) {
    if (this.statusBlock) {
      this.statusBlock.text(status);
    } else {
      this.statusBlock = d3.select(this.element).append("p").attr("align", "right").text(status);
    }
  },

  drawMatrix: function (dp) {
    var mat = dp.getMatrix(),
      n = mat.labels.length,
      rows = new Array(n),
      i = 0,
      entry,
      k;

    /* Format the rows to:
     {
     'timestamp': 100,
     'source1': 1,
     'source2:' 2
     },
     */
    Backshift.rows(mat).forEach(function (row) {
      entry = {};
      for (k = 0; k < n; k++) {
        entry[mat.labels[k]] = row[k];
      }
      rows[i++] = entry;
    }, this);

    // Retrieve the current status, if present
    var status = "";
    if (this.statusBlock) {
      status = this.statusBlock.text();
    }

    // Empty the div
    d3.select(this.element).selectAll("*").remove();

    // Re-append the status
    this.statusBlock = d3.select(this.element).append("p").attr("align", "right").text(status);

    // Draw the table
    this.tabulate(this.element, rows, mat.labels);

    // Add some meta-data to the div
    d3.select(this.element)
      .attr("data-matrix", JSON.stringify(mat));

    d3.select(this.element)
      .attr("data-rendered-at", Date.now());
  },

  /** Builds an HTML table using D3.
   *
   *  Shamelessly stolen from http://www.d3noob.org/2013/02/add-html-table-to-your-d3js-graph.html */
  tabulate: function (element, data, columns) {
    var table = d3.select(element).append("table")
        .attr("style", "font-size: 10px"),
      thead = table.append("thead"),
      tbody = table.append("tbody");

    // Append the header row
    thead.append("tr")
      .selectAll("th")
      .data(columns)
      .enter()
      .append("th")
      .text(function (column) {
        return column;
      });

    // Create a row for each object in the data
    var rows = tbody.selectAll("tr")
      .data(data)
      .enter()
      .append("tr");

    // Create a cell in each row for each column
    rows.selectAll("td")
      .data(function (row) {
        return columns.map(function (column) {
          return {column: column, value: row[column]};
        });
      })
      .enter()
      .append("td")
      .attr("style", "font-family: Courier; padding:0 15px 0 15px;")
      .attr("align", "center")
      .html(function (d) {
        return Number(d.value).toFixed(4);
      });

    return table;
  }
});
