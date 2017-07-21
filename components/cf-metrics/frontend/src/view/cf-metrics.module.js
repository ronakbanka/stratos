(function () {
  'use strict';

  angular
    .module('cf-metrics', ['cloud-foundry', 'nvd3'])
    .config(registerRoute)
    .run(registerAppTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.metrics', {
      url: '/metrics',
      templateUrl: 'cf-metrics/view/app-metrics.html',
      controller: ApplicationMetricsController,
      controllerAs: 'applicationMetricsController'
    });
    $stateProvider.state('endpoint.clusters.cluster.detail.metrics', {
      url: '/metrics',
      templateUrl: 'cf-metrics/view/cluster-metrics.html',
      controller: ClusterMetricsController,
      controllerAs: 'clusterMetricsCtrl'
    });
  }

  function registerAppTab($stateParams, cfApplicationTabs, cfTabs, modelManager) {
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

    cfTabs.clusterTabs.push({
      position: 10,
      hide: false,
      uiSref: 'endpoint.clusters.cluster.detail.metrics.cloud-controller',
      label: 'cf.metrics.label'
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

  /**
   * @name ClusterMetricsController
   * @constructor
   * @param {object} $location - the Angular $location service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $state - the UI router $state service
   * @param {object} $scope - the angular $scope service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.utils.appUtilsService} appUtilsService - utils service
   */
  function ClusterMetricsController($location, $stateParams, $state, $scope, modelManager, appUtilsService) {
    var vm = this;
    vm.tabs = [
      {
        position: 1,
        hide: false,
        uiSref: 'endpoint.clusters.cluster.detail.metrics.cloud-controller',
        label: 'cf.metrics.cc-label'
      },
      {
        position: 2,
        hide: false,
        uiSref: 'endpoint.clusters.cluster.detail.metrics.diego',
        label: 'cf.metrics.diego-label'
      },
      {
        position: 2,
        hide: false,
        uiSref: 'endpoint.clusters.cluster.detail.metrics.routing',
        label: 'cf.metrics.routing-label'
      }
    ];
  }

})();
