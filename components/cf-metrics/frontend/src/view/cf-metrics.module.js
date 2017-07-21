(function () {
  'use strict';

  angular
    .module('cf-metrics', ['cloud-foundry', 'nvd3'])
    .config(registerRoute)
    .run(registerAppTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.metrics', {
      url: '/metrics',
      templateUrl: 'cf-metrics/view/metrics.html',
      controller: ApplicationMetricsController,
      controllerAs: 'applicationMetricsController'
    });
  }

  function registerAppTab($stateParams, cfApplicationTabs, modelManager) {
    cfApplicationTabs.tabs.push({
      position: 8,
      hide: function () {
        var cnsiGuid = $stateParams.cnsiGuid;
        var cnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
                     //TODO  check if metrics are available
        return false;
      },
      uiSref: 'cf.applications.application.metrics',
      label: 'cf.metrics.label',
      clearState: function () {
      }
    });
  }

  /**
   * @name ApplicationMetricsController
   * @constructor
   * @param {object} $location - the Angular $location service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $state - the UI router $state service
   * @param {object} $scope - the angular $scope service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.utils.appUtilsService} appUtilsService - utils service
   */
  function ApplicationMetricsController($location, $stateParams, $state, $scope, modelManager, appUtilsService) {
    var vm = this;
    vm.cnsiGuid = $stateParams.cnsiGuid;
    vm.id = $stateParams.guid;

    vm.model = modelManager.retrieve('cloud-foundry.model.application');

    appUtilsService.chainStateResolve('cf.applications.application.metrics', $state, init);

    function init() {
      // Check that the user has permissions to be able to change the SSH status on the space
      var consoleInfo = modelManager.retrieve('app.model.consoleInfo');

      vm.ready = true;
    }
  }

})();
