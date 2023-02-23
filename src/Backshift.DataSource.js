import Backshift from './Backshift';

/**
 * Created by jwhite on 5/22/14.
 */

/**
 * Abstract data-source used to retrieve time series data.
 *
 * @constructor
 * @param {object} args Dictionary of arguments.
 * @param          [args.metrics]
 */
class DataSource extends Backshift {
  constructor(args) {
    super();

    if (args.metrics === undefined || args.metrics.length === 0) {
      Backshift.fail('DataSource needs one or more metrics.');
    }
    this.metrics = args.metrics;
    this.configure(args);
    this.onInit(args);
  }

  /**
   * @param {number} [start] Milliseconds since the Unix epoch.
   * @param {number} [end] Milliseconds since the Unix epoch.
   * @param {number} [resolution] Desired number of points.
   * @param {object} [args] Additional parameter that is passed to the callbacks.
   */
  query(start, end, resolution, args) {
    // Defined by subclasses
  }

  supportsQueries() {
    return true;
  }

  supportsStreaming() {
    return false;
  }

  onInit(args) {
    // Defined by subclasses
  }
}

Backshift.DataSource = DataSource;
export default DataSource;