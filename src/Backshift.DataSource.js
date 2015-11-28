/**
 * Created by jwhite on 5/22/14.
 */

Backshift.namespace('Backshift.DataSource');

/**
 * Abstract data-source used to retrieve time series data.
 *
 * @constructor
 * @param {object} args Dictionary of arguments.
 * @param          [args.metrics]
 */
Backshift.DataSource = Backshift.Class.create(Backshift.Class.Configurable, {

  initialize: function (args) {
    if (args.metrics === undefined || args.metrics.length === 0) {
      Backshift.fail('DataSource needs one or more metrics.');
    }

    this.metrics = args.metrics;

    this.configure(args);

    this.onInit(args);
  },

  defaults: function () {
    return {};
  },

  /**
   * @param {number} [start] Milliseconds since the Unix epoch.
   * @param {number} [end] Milliseconds since the Unix epoch.
   * @param {number} [resolution] Desired number of points.
   * @param {object} [args] Additional parameter that is passed to the callbacks.
   */
  query: function (start, end, resolution, args) {
    // Defined by subclasses
  },

  supportsQueries: function() {
    return true;
  },

  supportsStreaming: function() {
    return false;
  },

  onInit: function (args) {
    // Defined by subclasses
  }
});
