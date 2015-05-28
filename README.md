# Backshift [![Build Status](https://secure.travis-ci.org/j-white/backshift.png?branch=master)](http://travis-ci.org/j-white/backshift)

This library was built as an alternative to [rrdgraph](http://oss.oetiker.ch/rrdtool/doc/rrdgraph.en.html) for use in [OpenNMS](https://github.com/OpenNMS/opennms).

![](https://raw.githubusercontent.com/j-white/backshift/gh-pages/images/jrobin-vs-c3.png)

## Motivation

As our needs grew, we began investigating alternative time series databases.
One of the initial barriers to integrating these within OpenNMS was graphing: we needed a way for our users to visualize the metrics similar to how they were previously shown using *rrdgraph*.
The system already contained a large number of [prefabricated graphs](http://www.opennms.org/wiki/Prefabricated_Standard_Graphs) defined using *rrdgraph* commands and any suitable alternative needed to a way of rendering these.

And thus Backshift was born at [DevJam 2014](http://www.opennms.org/wiki/Dev-Jam_2014).

## Design

Backshift provides the glue between data sources and charting APIs.

Charts and data sources are made accessible via a consistent API, allowing these to be easily interchanged.

The actual rendering of the charts is performed by third party libraries i.e. [c3.js](http://c3js.org/) built to this end.

## Getting Started

### Building

Install the dependencies and build the minified script:

```
npm install
grunt
```

### Running the examples

Run the development web server:

```
npm start
```

Now browse to the examples at `http://localhost:8000/examples/`.
