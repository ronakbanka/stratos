(function () {
  'use strict';

  angular
    .module('cf-metrics')
    .directive('memorySection', memorySection);

  function memorySection() {
    return {
      bindToController: {
        appId: '@'
      },
      controller: memorySectionController,
      controllerAs: 'memorySectionCtrl',
      scope: {},
      templateUrl: 'cf-metrics/frontend/src/view/section/memory/memory.html'
    };
  }

  function memorySectionController(modelManager, appUtilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cf-metrics.metrics');
    this.metricFunction = that.metricsModel.getAppMemoryUsage;
    this.enableLegend = true;
    this.yTickFormatter = function (d) {
      return appUtilsService.mbToHumanSize(parseInt(d, 10) / (1024 * 1024)).replace('GB', '');
    };

  }
})();