(function () {
  'use strict';

  angular
    .module('cf-metrics')
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail.metrics.cloud-controller', {
      url: '/cc',
      templateUrl: 'cf-metrics/frontend/src/view/section/cloud-controller/cloud-controller.html',
      controller: cloudControllerController,
      controllerAs: 'cloudControllerCtrl'
    });
  }

  function cloudControllerController(modelManager, appUtilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cf-metrics.metrics');

    // Total Memory Consumption by Tasks
    this.getCCTasksRunningMemoryFunc = that.metricsModel.getCCTasksRunningMemory;
    this.getCCTasksRunningMemoryYTickFormatter = function (d) {
      return appUtilsService.mbToHumanSize(parseFloat(d));
    };

    // Total Tasks Running
    this.getCCTasksRunningCountFunc = that.metricsModel.getCCTasksRunningCount;
    this.getCCTasksRunningCountFuncYTickFormatter = function (d) {
      return d;
    };

    // CPU Load
    this.getCCCpuLoadFunc = that.metricsModel.getCCCpuLoad;
    this.getCCCpuLoadYTickFormatter = function (d) {
      return d;
    };

    // Memory
    this.getCCMemoryLoadFunc = that.metricsModel.getCCMemoryLoad;
    this.getCCMemoryLoadYTickFormatter = function (d) {
      return appUtilsService.mbToHumanSize(parseFloat(d/(1024 * 1024)));
    };
  }
})();