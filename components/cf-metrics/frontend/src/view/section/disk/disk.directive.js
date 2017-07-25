(function () {
  'use strict';

  angular
    .module('cf-metrics')
    .directive('diskSection', diskSection);

  function diskSection() {
    return {
      bindToController: {
        appId: '@'
      },
      controller: diskSectionController,
      controllerAs: 'diskSectionCtrl',
      scope: {},
      templateUrl: 'cf-metrics/view/section/disk/disk.html'
    };
  }

  function diskSectionController(modelManager, appUtilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cf-metrics.metrics');
    this.metricFunction = that.metricsModel.getAppDiskUsage;
    this.enableLegend = true;
    this.yTickFormatter = function (d) {
      return appUtilsService.mbToHumanSize(parseInt(d, 10) / (1024 * 1024)).replace('GB', '');
    };

  }
})();



