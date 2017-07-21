(function () {
  'use strict';

  angular
    .module('cf-metrics')
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail.metrics.routing', {
      url: '/routing',
      templateUrl: 'cf-metrics/frontend/src/view/section/routing/routing.html',
      controller: RoutingMetricsController,
      controllerAs: 'routingMetricsCtrl'
    });
  }

  function RoutingMetricsController(modelManager, appUtilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cf-metrics.metrics');

    this.getGoRouterLatencyFunc = that.metricsModel.getGoRouterLatency;
    this.getGoRouterLatencyYTickFormatter = function (d) {
      return d;
    };

    this.getGoRouterLookupTimeFunc = that.metricsModel.getGoRouterLookupTime;
    this.getGoRouterLookupTimeYTickFormatter = function (d) {
      return d;
    };

    this.getGoRouterMemoryAllocatedFunc = that.metricsModel.getGoRouterMemoryAllocated;
    this.getGoRouterMemoryAllocatedYTickFormatter = function (d) {
      return appUtilsService.mbToHumanSize(parseFloat(d/(1024 * 1024)));
    };
    
    this.getGoRoutingApiMemoryAllocatedFunc = that.metricsModel.getGoRoutingApiMemoryAllocated;
    this.getGoRoutingApiMemoryAllocatedYTickFormatter = function (d) {
      return appUtilsService.mbToHumanSize(parseFloat(d/(1024 * 1024)));
    };

  }
})();