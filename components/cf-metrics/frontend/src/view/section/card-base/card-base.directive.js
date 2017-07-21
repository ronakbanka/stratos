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
        enableLegend: '=',
        yTickFormatter: '&',
        metricFunction: '&'
      },
      controller: cardBaseController,
      controllerAs: 'cardBaseCtrl',
      scope: {},
      templateUrl: 'cf-metrics/frontend/src/view/section/card-base/card-base.html'
    };
  }

  function cardBaseController($q, $interval, modelManager, $stateParams) {

    var that = this;
    this.$q = $q;
    this.metricsModel = modelManager.retrieve('cf-metrics.metrics');

    this.cardData = {
      title: this.chartTitle
    };

    var cnsiGuid = $stateParams.cnsiGuid || $stateParams.guid
    this.metricsData = null;

    var intervalFunc = function () {
      var promise = null;
      if (that.appId){
        promise = that.metricFunction()(that.appId, cnsiGuid)
      } else {
        promise = that.metricFunction()(cnsiGuid)
      }
      promise
        .then(function (data) {
          that.metricsData = data
        })
    }

    intervalFunc()
    $interval(intervalFunc, 5000);

    this.getCardData = function () {
      return that.cardData;
    }

  }
})();