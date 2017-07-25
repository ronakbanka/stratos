(function () {
  'use strict';

  angular
    .module('cf-metrics')
    .directive('lineGraph', lineGraph);

  function lineGraph() {
    return {
      bindToController: {
        yLabel: '@',
        yTickFormatter: '&',
        metricsData: '=',
        chartId: '@',
        chartTitle: '@',
        enableLegend: '='
      },
      controller: LineGraphController,
      controllerAs: 'lineGraphCtrl',
      scope: {},
      templateUrl: 'cf-metrics/view/charts/line-graph/line-graph.html'
    };
  }

  function LineGraphController($scope, appUtilsService) {

    var that = this;
    this.appUtilsService = appUtilsService;

    this.seriesColor = ['#60799d', '#ad304b', '#2ab21e', '#efd402'];

    $scope.$watchCollection(function () {
      return [that.metricsData, that.chartApi];
    }, function () {
      if (!_.isUndefined(that.metricsData)) {
        if (_.isNull(that.metricsData)) {
          that.options.chart.noData = 'No data available';
          that.data = [];
          if (that.chartApi) {
            that.chartApi.refresh();
          }
        } else {
          that._updateChart();
        }
      }
    });

    this.options = {
      chart: {
        type: 'lineChart',
        height: 200,
        margin: {
          top: 20,
          right: 60,
          bottom: 50,
          left: 20
        },
        useInteractiveGuideline: true,
        dispatch: {},
        x: function (d) {
          return d[0]
        },
        y: function (d) {
          return d[1].toFixed(4)
        },
        xAxis: {
          axisLabel: null,
          tickFormat: this.timeTickFormatter,
          margin: {
            right: 40
          }
        },
        yAxis: {
          axisLabel: this.yLabel,
          showMaxMin: false,
          orient: 'right',
          tickFormat: function (d) {
            return that.yTickFormatter()()(d);
          },
          dispatch: {
            renderEnd: function () {
              var elementName = '#' + that.chartId;
              var selectedElements = d3.selectAll(elementName + ' svg');
              if (selectedElements.length > 0 && selectedElements[0][0]) {
                var width = parseInt(selectedElements.style('width').replace(/px/, ''), 10) - 80;
                var yAxis = d3.selectAll(elementName + ' svg .nv-y');
                yAxis.attr('transform', 'translate(' + width + ',0)');
              }

            }
          }
        },
        showLegend: this.enableLegend ? this.enableLegend : false,
        interpolate: 'basis'
      }
    };
    this.options.chart.noData = 'Loading data ...';

    this.chartApi = null;

    this.data = [];

  }

  angular.extend(LineGraphController.prototype, {


    timeTickFormatter: function (d) {
      var hours = Math.floor(moment.duration(moment().diff(moment(d * 1000))).asHours());
      if (hours === 0) {
        var minutes = Math.floor(moment.duration(moment().diff(moment(d * 1000))).asMinutes());
        if (minutes === 0) {
          return '<1 MIN';
        }
        return minutes + 'MIN';
      } else if (hours <= 2) {
        hours = Math.floor(moment.duration(moment().diff(moment(d * 1000))).asMinutes());
        return hours + 'MIN';
      }
      return hours + 'HR';
    },

    _updateChart: function () {

      var that = this;

      function calculateAverage(dataSeries) {

        var cumulativeDataPoints = [];
         _.each(dataSeries, function(dataSet){
          cumulativeDataPoints = dataSet.values.map(function(num, idx){
            var key = "" + num[0]
            if (cumulativeDataPoints[key]){
              cumulativeDataPoints[key][1].push(num[1]);
            } else {
              return [key, [num[1]]];
            }
          });
        });

        // Average across the array
        cumulativeDataPoints = cumulativeDataPoints.map(function(values, idx){
          return _.mean(values);
        });

        var average = _.mean(_.map(cumulativeDataPoints, '1'));
        var maxValue = _.max(_.map(cumulativeDataPoints));
        var minValue = _.min(_.map(cumulativeDataPoints));

        that.options.chart.yDomain = [minValue * 0.75, maxValue * 1.25];

        return _.map(cumulativeDataPoints, function (dataPoint) {
          return [dataPoint[0], average]
        });
      }


      this.data = [];
      var minValue = Number.MAX_VALUE;
      var maxValue = Number.MIN_VALUE;
      _.each(this.metricsData, function (dataSeries, index) {

        var instanceIndex = dataSeries.metric && dataSeries.metric.instance_index;
        that.data.push({
          color: that.seriesColor[instanceIndex ? parseInt(instanceIndex) : index],
          values: dataSeries.values,
          key: instanceIndex ? 'Instance #' + dataSeries.metric.instance_index : that.chartTitle
        });

        var seriesMinValue = _.min(_.map(dataSeries.values, '1'));
        var seriesMaxValue = _.max(_.map(dataSeries.values, '1'));

        minValue = seriesMinValue < minValue ? seriesMinValue : minValue;
        maxValue = seriesMaxValue > maxValue ? seriesMaxValue : maxValue;

      });
      this.options.chart.yDomain = [minValue * 0.75, maxValue * 1.25];

      // TODO average
      // this.data.push({
      //   color: '#60799d',
      //   values: calculateAverage(this.metricsData),
      //   key: 'Average'
      // });

    }
  });

})();