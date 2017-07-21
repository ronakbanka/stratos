(function () {
  'use strict';

  angular
    .module('cf-metrics')
    .directive('cardBase', cardBase);

  function cardBase() {
    return {
      bindToController: {
        appId: '@',
        yLabel: '@',
        chartId: '@',
        chartTitle: '@',
        yTickFormatter: '&',
        metricFunction: '&'
      },
      controller: cardBaseController,
      controllerAs: 'cardBaseCtrl',
      scope: {},
      templateUrl: 'cf-metrics/frontend/src/view/section/card-base/card-base.html'
    };
  }

  function cardBaseController($q, $interval, modelManager, $state) {

    var that = this;
    this.$state = $state;
    this.$q = $q;
    this.metricsModel = modelManager.retrieve('cf-metrics.metrics');

    this.cardData = {
      title: this.chartTitle
    };

    this.metricsData = null;
    $interval(function () {
      that.metricFunction()(that.appId)
        .then(function (data) {
          console.log(data);
          that.metricsData = data
        })
    }, 5000);

    this.getCardData = function () {
      return that.cardData;
    }

  }
})();