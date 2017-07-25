(function () {
  'use strict';

  angular
    .module('cf-metrics')
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail.metrics.diego', {
      url: '/diego',
      templateUrl: 'cf-metrics/view/section/diego/diego.html',
      controller: DiegoMetricsController,
      controllerAs: 'diegoMetricsCtrl'
    });
  }

  function DiegoMetricsController(modelManager, appUtilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cf-metrics.metrics');

    // Auctioneer Memory usage
    this.getAuctioneerMemAllocatedFunc = that.metricsModel.getAuctioneerMemAllocated;
    this.getAuctioneerMemAllocatedYTickFormatter = function (d) {
      return appUtilsService.mbToHumanSize(parseFloat(d/(1024 * 1024)));
    };

    this.getBbsMemAllocatedFunc = that.metricsModel.getBbsMemAllocated;
    this.getBbsMemAllocatedYTickFormatter = function (d) {
      return appUtilsService.mbToHumanSize(parseFloat(d/(1024 * 1024)));
    };

    this.getCcUploaderMemAllocatedFunc = that.metricsModel.getCcUploaderMemAllocated;
    this.getCcUploaderMemAllocatedYTickFormatter = function (d) {
      return appUtilsService.mbToHumanSize(parseFloat(d/(1024 * 1024)));
    };
    
    this.getFileServerMemAllocatedFunc = that.metricsModel.getFileServerMemAllocated;
    this.getFileServerMemAllocatedYTickFormatter = function (d) {
      return appUtilsService.mbToHumanSize(parseFloat(d/(1024 * 1024)));
    };
    
    this.getGardenLinuxMemAllocatedFunc = that.metricsModel.getGardenLinuxMemAllocated;
    this.getGardenLinuxMemAllocatedYTickFormatter = function (d) {
      return appUtilsService.mbToHumanSize(parseFloat(d/(1024 * 1024)));
    };

  }
})();