# Backshift

This library was built as an alternative to [rrdgraph](http://oss.oetiker.ch/rrdtool/doc/rrdgraph.en.html) for use in [OpenNMS](https://github.com/OpenNMS/opennms).

*rrdgraph* is great for visualizing *rrd* files, but was not built as a generic time series
visualization tool. As our needs grew and we began investigating other time series databases,
we needed a way of visualizing the data stored in these that leveraged the existing graph definitions.

## Design

### Data Source

The data source knows how to retrieve the values of the given named metrics.

## Getting Started

### Building
 
```
npm install
grunt
```
