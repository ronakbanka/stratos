package main

import (
	"errors"
	log "github.com/Sirupsen/logrus"

	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
	"github.com/labstack/echo"
)

type CFMetrics struct {
	portalProxy interfaces.PortalProxy
}

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &CFMetrics{portalProxy: portalProxy}, nil
}

func (cfMetrics *CFMetrics) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")

}

func (cfMetrics *CFMetrics) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (cfMetrics *CFMetrics) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return cfMetrics, nil

}

func (cfMetrics *CFMetrics) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (cfMetrics *CFMetrics) AddSessionGroupRoutes(sessionGroup *echo.Group) {
	// Setup /metrics passthrough group
	log.Infof("Adding /metrics path")
	metricsGroup := sessionGroup.Group("/metrics")
	metricsGroup.Any("/*", cfMetrics.proxy)
}

func (cfMetrics *CFMetrics) Init() error {

	return nil
}
