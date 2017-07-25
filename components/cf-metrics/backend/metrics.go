package main

import (
	"net/http"
	"strings"

	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/url"

	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine"
	"github.com/labstack/echo/engine/standard"
)

type CNSIRequest struct {
	GUID              string
	UserGUID          string
	SkipSSLValidation bool

	Method      string
	Body        []byte
	Header      http.Header
	URL         *url.URL
	StatusCode  int
	PassThrough bool

	Response []byte
	Error    error
}

func (cfMetrics *CFMetrics) proxy(c echo.Context) error {
	log.Info("metricsProxy")
	cnsiList := strings.Split(c.Request().Header().Get("x-cnap-cnsi-list"), ",")
	shouldPassthrough := "true" == c.Request().Header().Get("x-cnap-passthrough")

	uri := makeRequestURI(c)
	log.Infof("Will send this uri request %+v", uri)

	header := getEchoHeaders(c)
	header.Del("Cookie")

	portalUserGUID, err := getPortalUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	req, body, err := getRequestParts(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// send the request to each CNSI
	done := make(chan *CNSIRequest)
	for _, cnsi := range cnsiList {
		cnsiRequest, buildErr := cfMetrics.buildMetricsRequest(cnsi, portalUserGUID, req.Method(), uri, body, header)
		if buildErr != nil {
			return echo.NewHTTPError(http.StatusBadRequest, buildErr.Error())
		}

		log.Infof("Will send this request %+v", cnsiRequest)
		go cfMetrics.doRequest(&cnsiRequest, done)
	}

	responses := make(map[string]*CNSIRequest)
	for range cnsiList {
		res := <-done
		responses[res.GUID] = res
	}

	if shouldPassthrough {
		cnsiGUID := cnsiList[0]
		res, ok := responses[cnsiGUID]
		if !ok {
			return echo.NewHTTPError(http.StatusRequestTimeout, "Request timed out")
		}

		// in passthrough mode, set the status code to that of the single response
		c.Response().WriteHeader(res.StatusCode)

		// we don't care if this fails
		_, _ = c.Response().Write(res.Response)

		return nil
	}

	jsonResponse := buildJSONResponse(cnsiList, responses)
	e := json.NewEncoder(c.Response())
	err = e.Encode(jsonResponse)
	if err != nil {
		log.Errorf("Failed to encode JSON: %v\n%#v\n", err, jsonResponse)
	}
	return err
}

func makeRequestURI(c echo.Context) *url.URL {
	log.Debug("makeRequestURI")
	uri := getEchoURL(c)
	prefix := strings.TrimSuffix(c.Path(), "*")
	uri.Path = strings.TrimPrefix(uri.Path, prefix)

	return &uri
}

func getEchoHeaders(c echo.Context) http.Header {
	log.Debug("getEchoHeaders")
	h := make(http.Header)
	originalHeader := c.Request().Header().(*standard.Header).Header
	for k, v := range originalHeader {
		if k == "Cookie" {
			continue
		}
		vCopy := make([]string, len(v))
		copy(vCopy, v)
		h[k] = vCopy
	}

	return h
}

func getRequestParts(c echo.Context) (engine.Request, []byte, error) {
	log.Debug("getRequestParts")
	var body []byte
	var err error
	req := c.Request()
	if bodyReader := req.Body(); bodyReader != nil {
		if body, err = ioutil.ReadAll(bodyReader); err != nil {
			return nil, nil, errors.New("Failed to read request body")
		}
	}
	return req, body, nil
}

func getPortalUserGUID(c echo.Context) (string, error) {
	log.Debug("getPortalUserGUID")
	portalUserGUIDIntf := c.Get("user_id")
	if portalUserGUIDIntf == nil {
		return "", errors.New("Corrupted session")
	}
	return portalUserGUIDIntf.(string), nil
}

func (cfMetrics *CFMetrics) buildMetricsRequest(cnsiGUID string, userGUID string, method string, uri *url.URL, body []byte, header http.Header) (CNSIRequest, error) {
	log.Info("buildCNSIRequest")
	cnsiRequest := CNSIRequest{
		GUID:     cnsiGUID,
		UserGUID: userGUID,

		Method: method,
		Body:   body,
		Header: header,
	}
	log.Infof("Will look for cnsiGuid %s", cnsiGUID)
	cnsiRec, err := cfMetrics.portalProxy.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return cnsiRequest, err
	}

	cnsiRequest.URL = new(url.URL)

	if cnsiRequest.URL, err = url.Parse(cnsiRec.MetricsEndpoint); err != nil {
		return cnsiRequest, fmt.Errorf("Unable to parse Metrics Endpoint for CNSI %s", cnsiRec.MetricsEndpoint)
	}
	cnsiRequest.URL.Path = uri.Path
	cnsiRequest.URL.RawQuery = uri.RawQuery
	cnsiRequest.SkipSSLValidation = cnsiRec.SkipSSLValidation

	return cnsiRequest, nil
}

func (cfMetrics *CFMetrics) doRequest(cnsiRequest *CNSIRequest, done chan<- *CNSIRequest) {
	log.Info("Sending metrics Request")

	var body io.Reader
	var res *http.Response
	var req *http.Request
	var err error

	if len(cnsiRequest.Body) > 0 {
		body = bytes.NewReader(cnsiRequest.Body)
	}
	req, err = http.NewRequest(cnsiRequest.Method, cnsiRequest.URL.String(), body)
	if err != nil {
		cnsiRequest.Error = err
		if done != nil {
			done <- cnsiRequest
		}
		return
	}

	client := cfMetrics.portalProxy.GetHttpClient(cnsiRequest.SkipSSLValidation)
	res, err = client.Do(req)

	if err != nil {
		cnsiRequest.StatusCode = 500
		cnsiRequest.Response = []byte(err.Error())
		cnsiRequest.Error = err
	} else if res.Body != nil {
		cnsiRequest.StatusCode = res.StatusCode
		cnsiRequest.Response, cnsiRequest.Error = ioutil.ReadAll(res.Body)
		defer res.Body.Close()
	}

	if done != nil {
		done <- cnsiRequest
	}

}

func buildJSONResponse(cnsiList []string, responses map[string]*CNSIRequest) map[string]*json.RawMessage {
	log.Debug("buildJSONResponse")
	jsonResponse := make(map[string]*json.RawMessage)
	for _, guid := range cnsiList {
		var response []byte
		cnsiResponse, ok := responses[guid]
		switch {
		case !ok:
			response = []byte(`{"error": "Request timed out"}`)
		case cnsiResponse.Error != nil:
			response = []byte(fmt.Sprintf(`{"error": %q}`, cnsiResponse.Error.Error()))
		case cnsiResponse.Response != nil:
			response = cnsiResponse.Response
		}
		// Check the HTTP Status code to make sure that it is actually a valid response
		if cnsiResponse.StatusCode >= 400 {
			response = []byte(fmt.Sprintf(`{"error": "Unexpected HTTP status code: %d"}`, cnsiResponse.StatusCode))
		}
		if len(response) > 0 {
			jsonResponse[guid] = (*json.RawMessage)(&response)
		} else {
			jsonResponse[guid] = nil
		}
	}

	return jsonResponse
}

func (cfMetrics *CFMetrics) addMetricsEndpoint(c echo.Context) error {
	log.Info("addMetricsEndpoint")
	metricsEndpoint := c.FormValue("metrics_endpoint")
	cnsiGuid := c.FormValue("cnsi_guid")

	log.Infof("Received request for: %s, %s", metricsEndpoint, cnsiGuid)

	cnsiRec, err := cfMetrics.portalProxy.GetCNSIRecord(cnsiGuid)
	if err != nil {
		log.Infof("Failed %s, %s", err)
		echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("Unable to find CNSI %s", cnsiGuid))
		return err
	}
	cnsiRec.MetricsEndpoint = metricsEndpoint
	err = cfMetrics.portalProxy.UpdateCNSIRecord(cnsiGuid, cnsiRec)
	if err != nil {
		log.Infof("Failed %s, %s", err)
		echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("Failed to update CNSI Record"))
		return err
	}

	c.NoContent(http.StatusOK)
	return nil
}

func getEchoURL(c echo.Context) url.URL {
	log.Debug("getEchoURL")
	u := c.Request().URL().(*standard.URL).URL

	// dereference so we get a copy
	return *u
}
