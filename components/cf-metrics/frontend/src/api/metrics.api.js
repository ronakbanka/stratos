(function () {
  'use strict';

  angular
    .module('cf-metrics')
    .run(registrMetricsApi);

  function registrMetricsApi($http, $httpParamSerializer, apiManager) {
    apiManager.register('cf-metrics.metrics', new MetricsApi($http, $httpParamSerializer));
  }

  function MetricsApi($http, $httpParamSerializer) {

    this.$httpParamSerializer = $httpParamSerializer;

    var metricsUrl = '/pp/v1/metrics/';

    // Exports
    this.getAppCpuUsage = _metricsQuery('firehose_container_metric_cpu_percentage');
    this.getAppMemoryUsage = _metricsQuery('firehose_container_metric_memory_bytes');
    this.getAppDiskUsage = _metricsQuery('firehose_container_metric_disk_bytes');

    function _metricsQuery(metrics) {
      return function (filter, time) {

        var config = {
          headers:{}
        };
        config.headers['x-cnap-passthrough']  =  'true';

        if (!time) {
          time = '[60m]';
        }
        config.url = metricsUrl + 'api/v1/query?query=' + metrics + (filter ? filter : '') + time;
        config.method = 'GET';
        return $http(config);
      };
    }

  }

})();