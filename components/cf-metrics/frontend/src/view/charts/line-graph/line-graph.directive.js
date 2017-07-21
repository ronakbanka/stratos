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
        chartTitle: '@'
      },
      controller: LineGraphController,
      controllerAs: 'lineGraphCtrl',
      scope: {},
      templateUrl: 'cf-metrics/frontend/src/view/charts/line-graph/line-graph.html'
    };
  }

  function LineGraphController($scope, appUtilsService) {

    var that = this;
    this.appUtilsService = appUtilsService;

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
        x: function(d){
          return d[0]
        },
        y: function(d){
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
          axisLabelDistance: -20,
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
        showLegend: false,
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

      function calculateAverage(dataPoints) {

        var average = _.mean(_.map(dataPoints, '1'));
        var maxValue = _.max(_.map(dataPoints, '1'));
        var minValue = _.min(_.map(dataPoints, '1'));

        that.options.chart.yDomain = [minValue * 0.75, maxValue * 1.25];

        return _.map(dataPoints, function (dataPoint) {
          return [dataPoint[0], average]
        });
      }

      this.data = [
        {
          color: '#60799d',
          values: this.metricsData.values,
          key: this.chartTitle
        },
        {
          color: '#60799d',
          values: calculateAverage(this.metricsData.values),
          key: 'Average'
        }];
    }


  });

})();