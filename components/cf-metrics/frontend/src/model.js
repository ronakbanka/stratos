(function () {
  'use strict';

  /**
   * @namespace control-plane.model.metrics
   * @memberOf control-plane.model
   * @name metrics
   * @description Heapster Metrics
   */
  angular
    .module('cf-metrics')
    .run(registerMetricsModel);

  function registerMetricsModel($q, modelManager, apiManager, modelUtils) {
    modelManager.register('cf-metrics.metrics', new MetricsModel($q, apiManager, modelUtils));
  }

  function MetricsModel($q, apiManager, modelUtils) {

    // App Exports
    this.getAppCpuUsage = getAppCpuUsage;
    this.getAppMemoryUsage = getAppMemoryUsage;
    this.getAppDiskUsage = getAppDiskUsage;
    
    // Cluster Exports
    this.getCCTasksRunningMemory = getCCTasksRunningMemory;
    this.getCCTasksRunningCount = getCCTasksRunningCount;
    this.getCCCpuLoad = getCCCpuLoad;
    this.getCCMemoryLoad = getCCMemoryLoad;

    this.getAuctioneerMemAllocated = getAuctioneerMemAllocated;
    this.getBbsMemAllocated = getBbsMemAllocated;
    this.getCcUploaderMemAllocated = getCcUploaderMemAllocated;
    this.getFileServerMemAllocated = getFileServerMemAllocated;
    this.getGardenLinuxMemAllocated = getGardenLinuxMemAllocated;

    this.getGoRouterLatency = getGoRouterLatency;
    this.getGoRouterLookupTime = getGoRouterLookupTime;
    this.getGoRouterMemoryAllocated = getGoRouterMemoryAllocated;
    this.getGoRoutingApiMemoryAllocated = getGoRoutingApiMemoryAllocated;

    this.addMetricsEndpoint = addMetricsEndpoint;
   
    this.makeApplicationIdFilter = makeApplicationIdFilter;
    this._parseValues = _parseValues;
    this._isErrorResponse = _isErrorResponse;


    function fetchAppMetricsData(appId, cnsiGuid, apiMetricsFunc) {
      return apiMetricsFunc(makeApplicationIdFilter(appId), modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (res) {
          if (_isErrorResponse(res)) {
            return $q.reject(res.data);
          }
          res.data.data.result = _parseValues(res);
          return res.data.data.result;
        });
    }

    function fetchCFMetricsData(cnsiGuid, apiMetricsFunc) {
      return apiMetricsFunc(null,  modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (res) {
          if (_isErrorResponse(res)) {
            return $q.reject(res.data);
          }
          res.data.data.result = _parseValues(res);
          return res.data.data.result;
        });
    }


    function _parseValues(res) {

      var resultArray = [];
      _.each(res.data.data.result, function(result){
        var valuesArray = result.values;
        result.values = _.transform(valuesArray, function (result, value) {
          var dataPoint = value;
          dataPoint[1] = parseFloat(dataPoint[1]);
          result.push(dataPoint);
          return true;
        });
        resultArray.push(result)
      });
      return resultArray;
    }

    function getAppCpuUsage(appId, cnsiGuid) {
      return fetchAppMetricsData(appId, cnsiGuid,
      apiManager.retrieve('cf-metrics.metrics')
        .getAppCpuUsage);
    }

    function getAppMemoryUsage(appId, cnsiGuid) {
      return fetchAppMetricsData(appId, cnsiGuid,
      apiManager.retrieve('cf-metrics.metrics')
        .getAppMemoryUsage);
    }

    function getAppDiskUsage(appId, cnsiGuid) {
      return fetchAppMetricsData(appId, cnsiGuid,
      apiManager.retrieve('cf-metrics.metrics')
        .getAppDiskUsage);
    }

    function getCCTasksRunningMemory(cnsiGuid) {
      return fetchCFMetricsData(cnsiGuid, apiManager.retrieve('cf-metrics.metrics').getCCTasksRunningMemory);
    }

    function getCCTasksRunningCount(cnsiGuid) {
      return fetchCFMetricsData(cnsiGuid, apiManager.retrieve('cf-metrics.metrics').getCCTasksRunningCount);
    }

    function getCCCpuLoad(cnsiGuid) {
      return fetchCFMetricsData(cnsiGuid, apiManager.retrieve('cf-metrics.metrics').getCCCpuLoad);
    }

    function getCCMemoryLoad(cnsiGuid) {
      return fetchCFMetricsData(cnsiGuid, apiManager.retrieve('cf-metrics.metrics').getCCMemoryLoad);
    }

    function getAuctioneerMemAllocated(cnsiGuid) {
      return fetchCFMetricsData(cnsiGuid, apiManager.retrieve('cf-metrics.metrics').getAuctioneerMemAllocated);
    }

    function getBbsMemAllocated(cnsiGuid) {
      return fetchCFMetricsData(cnsiGuid, apiManager.retrieve('cf-metrics.metrics').getBbsMemAllocated);
    }

    function getCcUploaderMemAllocated(cnsiGuid) {
      return fetchCFMetricsData(cnsiGuid, apiManager.retrieve('cf-metrics.metrics').getCcUploaderMemAllocated);
    }

    function getFileServerMemAllocated(cnsiGuid) {
      return fetchCFMetricsData(cnsiGuid, apiManager.retrieve('cf-metrics.metrics').getFileServerMemAllocated);
    }

    function getGardenLinuxMemAllocated(cnsiGuid) {
      return fetchCFMetricsData(cnsiGuid, apiManager.retrieve('cf-metrics.metrics').getGardenLinuxMemAllocated);
    }

    function getGoRouterLatency(cnsiGuid) {
      return fetchCFMetricsData(cnsiGuid, apiManager.retrieve('cf-metrics.metrics').getGoRouterLatency);
    }

    function getGoRouterLookupTime(cnsiGuid) {
      return fetchCFMetricsData(cnsiGuid, apiManager.retrieve('cf-metrics.metrics').getGoRouterLookupTime);
    }

    function getGoRouterMemoryAllocated(cnsiGuid) {
      return fetchCFMetricsData(cnsiGuid, apiManager.retrieve('cf-metrics.metrics').getGoRouterMemoryAllocated);
    }

    function getGoRoutingApiMemoryAllocated(cnsiGuid) {
      return fetchCFMetricsData(cnsiGuid, apiManager.retrieve('cf-metrics.metrics').getGoRoutingApiMemoryAllocated);
    }

    function _isErrorResponse(res) {
      return !(res && res.data && res.data.status === 'success')
    }

    function addMetricsEndpoint(metricsEndpoint, cnsiGuid) {
       return apiManager.retrieve('cf-metrics.metrics').addMetricsEndpoint(metricsEndpoint, cnsiGuid);
    }

    function makeApplicationIdFilter(appId) {
      return '{application_id="' + appId + '"}';
    }

  }
})();