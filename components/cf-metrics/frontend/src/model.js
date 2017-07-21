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

  function registerMetricsModel($q, modelManager, apiManager) {
    modelManager.register('cf-metrics.metrics', new MetricsModel($q, apiManager));
  }

  function MetricsModel($q, apiManager) {

    // Exports
    this.getAppCpuUsage = getAppCpuUsage;
    this.getAppMemoryUsage = getAppMemoryUsage;
    this.getAppDiskUsage = getAppDiskUsage;
    this.makeApplicationIdFilter = makeApplicationIdFilter;
    this._parseValues = _parseValues;
    this._isErrorResponse = _isErrorResponse;

    function _parseValues(res) {
      var valuesArray = res.data.data.result[0].values;
      var parsedValuesArray = _.transform(valuesArray, function (result, value) {
        var dataPoint = value;
        dataPoint[1] = parseFloat(dataPoint[1]);
        result.push(dataPoint);
        return true;
      });
      return parsedValuesArray;
    }

    function getAppCpuUsage(appId) {
      return apiManager.retrieve('cf-metrics.metrics')
        .getAppCpuUsage(makeApplicationIdFilter(appId))
        .then(function (res) {
          if (_isErrorResponse(res)) {
            return $q.reject(res.data);
          }
          res.data.data.result[0].values = _parseValues(res);
          return res.data.data.result[0];
        });
    }

    function getAppMemoryUsage(appId) {
      return apiManager.retrieve('cf-metrics.metrics')
        .getAppMemoryUsage(makeApplicationIdFilter(appId))
        .then(function (res) {
          if (_isErrorResponse(res)) {
            return $q.reject(res.data);
          }
          res.data.data.result[0].values = _parseValues(res);
          return res.data.data.result[0];
        });
    }

    function getAppDiskUsage(appId) {
      return apiManager.retrieve('cf-metrics.metrics')
        .getAppDiskUsage(makeApplicationIdFilter(appId))
        .then(function (res) {
          if (_isErrorResponse(res)) {
            return $q.reject(res.data);
          }
          res.data.data.result[0].values = _parseValues(res);
          return res.data.data.result[0];
        });
    }

    function _isErrorResponse(res) {
      return !(res && res.data && res.data.status === 'success')
    }


    function makeApplicationIdFilter(appId) {
      return '{application_id="' + appId + '"}';
    }

  }
})();