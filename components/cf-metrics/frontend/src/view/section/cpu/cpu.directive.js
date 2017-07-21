(function () {
  'use strict';

  angular
    .module('cf-metrics')
    .directive('cpuSection', cpuSection);

  function cpuSection() {
    return {
      bindToController: {
        appId: '@'
      },
      controller: cpuSectionController,
      controllerAs: 'cpuSectionCtrl',
      scope: {},
      templateUrl: 'cf-metrics/frontend/src/view/section/cpu/cpu.html'
    };
  }

  function cpuSectionController(modelManager) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cf-metrics.metrics');
    this.metricFunction = that.metricsModel.getAppCpuUsage;
    this.enableLegend = true;
    this.yTickFormatter = function (d) {
      return d * 100;
    }

  }

})();