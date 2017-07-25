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

    // App Metrics
    this.getAppCpuUsage = _metricsQuery('firehose_container_metric_cpu_percentage');
    this.getAppMemoryUsage = _metricsQuery('firehose_container_metric_memory_bytes');
    this.getAppDiskUsage = _metricsQuery('firehose_container_metric_disk_bytes');

    // Cloud Controller metrics
    this.getCCTasksRunningMemory = _metricsQuery('firehose_value_metric_cc_tasks_running_memory_in_mb');
    this.getCCTasksRunningCount = _metricsQuery('firehose_value_metric_cc_tasks_running_count');
    this.getCCCpuLoad = _metricsQuery('firehose_value_metric_cc_vitals_cpu');
    this.getCCMemoryLoad = _metricsQuery('firehose_value_metric_cc_vitals_mem_bytes');

    //Diego
    this.getAuctioneerMemAllocated = _metricsQuery('firehose_value_metric_auctioneer_memory_stats_num_bytes_allocated');
    this.getBbsMemAllocated = _metricsQuery('firehose_value_metric_bbs_memory_stats_num_bytes_allocated');
    this.getCcUploaderMemAllocated = _metricsQuery('firehose_value_metric_cc_uploader_memory_stats_num_bytes_allocated');
    this.getFileServerMemAllocated = _metricsQuery('firehose_value_metric_file_server_memory_stats_num_bytes_allocated');
    this.getGardenLinuxMemAllocated = _metricsQuery('firehose_value_metric_garden_linux_memory_stats_num_bytes_allocated');

    // Go router
    this.getGoRouterLatency = _metricsQuery('firehose_value_metric_gorouter_latency');
    this.getGoRouterLookupTime = _metricsQuery('firehose_value_metric_gorouter_route_lookup_time');
    this.getGoRouterMemoryAllocated = _metricsQuery('firehose_value_metric_gorouter_memory_stats_num_bytes_allocated');
    this.getGoRoutingApiMemoryAllocated = _metricsQuery('firehose_value_metric_routing_api_memory_stats_num_bytes_allocated');

    this.addMetricsEndpoint = addMetricsEndpoint;
 
    function _metricsQuery(metrics) {
      return function (filter, httpConfigOptions, time) {
        var config = {};
      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }

       if (!time) {
          time = '[60m]';
        }
        config.url = metricsUrl + 'proxy/api/v1/query?query=' + metrics + (filter ? filter : '') + time;
        config.method = 'GET';
        return $http(config);
      };
    }

    function addMetricsEndpoint(metricsEndpoint, cnsiGuid) {
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      var data = $httpParamSerializer({
        metrics_endpoint: metricsEndpoint,
        cnsi_guid: cnsiGuid
      });
      return $http.post('/pp/v1/metrics/add', data, config);
    }
  }

})();