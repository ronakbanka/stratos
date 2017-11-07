package main

import (
	"errors"

	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
)

type StratrosMetrics struct {
	portalProxy  interfaces.PortalProxy
	endpointType string
}

const (
	EndpointType  = "stratos-metrics"
	CLIENT_ID_KEY = "CF_CLIENT"
)

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &StratrosMetrics{portalProxy: portalProxy, endpointType: EndpointType}, nil
}

func (c *StratrosMetrics) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return c, nil
}

func (c *StratrosMetrics) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return c, nil
}

func (c *StratrosMetrics) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (c *StratrosMetrics) GetType() string {
	return EndpointType
}

func (c *StratrosMetrics) GetClientId() string {
	return ""
}

func (c *StratrosMetrics) Register(echoContext echo.Context) error {
	log.Info("Register Stratos-Metrics endpoint...")
	return c.portalProxy.RegisterEndpoint(echoContext, c.Info)
}

func (c *StratrosMetrics) Init() error {
	return nil
}

func (c *StratrosMetrics) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (c *StratrosMetrics) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (c *StratrosMetrics) Info(apiEndpoint string, skipSSLValidation bool) (interfaces.CNSIRecord, interface{}, error) {
	log.Debug("Info")
	// No-op for now
	var newCNSI interfaces.CNSIRecord

	newCNSI.CNSIType = EndpointType

	return newCNSI, nil, nil
}
