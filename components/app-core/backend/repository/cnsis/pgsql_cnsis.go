package cnsis

import (
	"database/sql"
	"errors"
	"fmt"
	"net/url"

	"github.com/SUSE/stratos-ui/components/app-core/backend/datastore"

	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
	log "github.com/Sirupsen/logrus"
)

var listCNSIs = `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint, doppler_logging_endpoint, skip_ssl_validation, metrics_endpoint
							FROM cnsis`

var listCNSIsByUser = `SELECT c.guid, c.name, c.cnsi_type, c.api_endpoint, t.user_guid, t.token_expiry, c.skip_ssl_validation, c.metrics_endpoint
										FROM cnsis c, tokens t
										WHERE c.guid = t.cnsi_guid AND t.token_type=$1 AND t.user_guid=$2`

var findCNSI = `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint, doppler_logging_endpoint, skip_ssl_validation, metrics_endpoint
						FROM cnsis
						WHERE guid=$1`

var findCNSIByAPIEndpoint = `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint, doppler_logging_endpoint, skip_ssl_validation, metrics_endpoint
						FROM cnsis
						WHERE api_endpoint=$1`

var saveCNSI = `INSERT INTO cnsis (guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint, doppler_logging_endpoint, skip_ssl_validation, metrics_endpoint)
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

var updateCNSI = `UPDATE cnsis 
					SET name = $1, 
						cnsi_type = $2, 
						api_endpoint = $3, 
						auth_endpoint = $4, 
						token_endpoint = $5, 
						doppler_logging_endpoint = $6, 
						skip_ssl_validation = $7, 
						metrics_endpoint = $8 
					WHERE guid = $9
	`

var deleteCNSI = `DELETE FROM cnsis WHERE guid = $1`

// TODO (wchrisjohnson) We need to adjust several calls ^ to accept a list of items (guids) as input

// PostgresCNSIRepository is a PostgreSQL-backed CNSI repository
type PostgresCNSIRepository struct {
	db *sql.DB
}

// NewPostgresCNSIRepository will create a new instance of the PostgresCNSIRepository
func NewPostgresCNSIRepository(dcp *sql.DB) (Repository, error) {
	return &PostgresCNSIRepository{db: dcp}, nil
}

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	listCNSIs = datastore.ModifySQLStatement(listCNSIs, databaseProvider)
	listCNSIsByUser = datastore.ModifySQLStatement(listCNSIsByUser, databaseProvider)
	findCNSI = datastore.ModifySQLStatement(findCNSI, databaseProvider)
	findCNSIByAPIEndpoint = datastore.ModifySQLStatement(findCNSIByAPIEndpoint, databaseProvider)
	saveCNSI = datastore.ModifySQLStatement(saveCNSI, databaseProvider)
	deleteCNSI = datastore.ModifySQLStatement(deleteCNSI, databaseProvider)
	updateCNSI = datastore.ModifySQLStatement(updateCNSI, databaseProvider)
}

// List - Returns a list of CNSI Records
func (p *PostgresCNSIRepository) List() ([]*interfaces.CNSIRecord, error) {
	log.Println("List")
	rows, err := p.db.Query(listCNSIs)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve CNSI records: %v", err)
	}
	defer rows.Close()

	var cnsiList []*interfaces.CNSIRecord
	cnsiList = make([]*interfaces.CNSIRecord, 0)

	for rows.Next() {
		var (
			pCNSIType string
			pURL      string
		)

		cnsi := new(interfaces.CNSIRecord)

		err := rows.Scan(&cnsi.GUID, &cnsi.Name, &pCNSIType, &pURL, &cnsi.AuthorizationEndpoint, &cnsi.TokenEndpoint, &cnsi.DopplerLoggingEndpoint, &cnsi.SkipSSLValidation, &cnsi.MetricsEndpoint)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan CNSI records: %v", err)
		}

		cnsi.CNSIType = pCNSIType

		if cnsi.APIEndpoint, err = url.Parse(pURL); err != nil {
			return nil, fmt.Errorf("Unable to parse API Endpoint: %v", err)
		}

		cnsiList = append(cnsiList, cnsi)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to List CNSI records: %v", err)
	}

	// rows.Close()

	return cnsiList, nil
}

// ListByUser - Returns a list of CNSIs registered by a user
func (p *PostgresCNSIRepository) ListByUser(userGUID string) ([]*RegisteredCluster, error) {
	log.Println("ListByUser")
	rows, err := p.db.Query(listCNSIsByUser, "cnsi", userGUID)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve CNSI records: %v", err)
	}
	defer rows.Close()

	var clusterList []*RegisteredCluster
	clusterList = make([]*RegisteredCluster, 0)

	for rows.Next() {
		var (
			pCNSIType string
			pURL      string
		)

		cluster := new(RegisteredCluster)
		err := rows.Scan(&cluster.GUID, &cluster.Name, &pCNSIType, &pURL, &cluster.Account, &cluster.TokenExpiry, &cluster.SkipSSLValidation, &cluster.MetricsEndpoint)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan cluster records: %v", err)
		}

		cluster.CNSIType = pCNSIType

		if cluster.APIEndpoint, err = url.Parse(pURL); err != nil {
			return nil, fmt.Errorf("Unable to parse API Endpoint: %v", err)
		}

		// rows.Close()

		clusterList = append(clusterList, cluster)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to List cluster records: %v", err)
	}

	return clusterList, nil
}

// Find - Returns a single CNSI Record
func (p *PostgresCNSIRepository) Find(guid string) (interfaces.CNSIRecord, error) {
	log.Println("Find")
	var (
		pCNSIType string
		pURL      string
	)

	cnsi := new(interfaces.CNSIRecord)

	err := p.db.QueryRow(findCNSI, guid).Scan(&cnsi.GUID, &cnsi.Name, &pCNSIType, &pURL,
		&cnsi.AuthorizationEndpoint, &cnsi.TokenEndpoint, &cnsi.DopplerLoggingEndpoint, &cnsi.SkipSSLValidation, &cnsi.MetricsEndpoint)

	switch {
	case err == sql.ErrNoRows:
		return interfaces.CNSIRecord{}, errors.New("No match for that GUID")
	case err != nil:
		return interfaces.CNSIRecord{}, fmt.Errorf("Error trying to Find CNSI record: %v", err)
	default:
		// do nothing
	}

	// TODO(wchrisjohnson): discover a way to do this automagically
	// These two fields need to be converted manually
	cnsi.CNSIType = pCNSIType

	if cnsi.APIEndpoint, err = url.Parse(pURL); err != nil {
		return interfaces.CNSIRecord{}, fmt.Errorf("Unable to parse API Endpoint: %v", err)
	}

	return *cnsi, nil
}

// FindByAPIEndpoint - Returns a single CNSI Record
func (p *PostgresCNSIRepository) FindByAPIEndpoint(endpoint string) (interfaces.CNSIRecord, error) {
	log.Println("Find")
	var (
		pCNSIType string
		pURL      string
	)

	cnsi := new(interfaces.CNSIRecord)

	err := p.db.QueryRow(findCNSIByAPIEndpoint, endpoint).Scan(&cnsi.GUID, &cnsi.Name, &pCNSIType, &pURL,
		&cnsi.AuthorizationEndpoint, &cnsi.TokenEndpoint, &cnsi.DopplerLoggingEndpoint, &cnsi.SkipSSLValidation, &cnsi.MetricsEndpoint)

	switch {
	case err == sql.ErrNoRows:
		return interfaces.CNSIRecord{}, errors.New("No match for that API Endpoint")
	case err != nil:
		return interfaces.CNSIRecord{}, fmt.Errorf("Error trying to Find CNSI record: %v", err)
	default:
		// do nothing
	}

	// TODO(wchrisjohnson): discover a way to do this automagically
	// These two fields need to be converted manually
	cnsi.CNSIType = pCNSIType

	if cnsi.APIEndpoint, err = url.Parse(pURL); err != nil {
		return interfaces.CNSIRecord{}, fmt.Errorf("Unable to parse API Endpoint: %v", err)
	}

	return *cnsi, nil
}

// Save - Persist a CNSI Record to a datastore
func (p *PostgresCNSIRepository) Save(guid string, cnsi interfaces.CNSIRecord) error {
	log.Println("Save")
	if _, err := p.db.Exec(saveCNSI, guid, cnsi.Name, fmt.Sprintf("%s", cnsi.CNSIType),
		fmt.Sprintf("%s", cnsi.APIEndpoint), cnsi.AuthorizationEndpoint, cnsi.TokenEndpoint, cnsi.DopplerLoggingEndpoint, cnsi.SkipSSLValidation, cnsi.MetricsEndpoint); err != nil {
		return fmt.Errorf("Unable to Save CNSI record: %v", err)
	}

	return nil
}

// Update - Persist a CNSI Record to a datastore
func (p *PostgresCNSIRepository) Update(guid string, cnsi interfaces.CNSIRecord) error {
	log.Println("Update")
	if _, err := p.db.Exec(updateCNSI, cnsi.Name, fmt.Sprintf("%s", cnsi.CNSIType),
		fmt.Sprintf("%s", cnsi.APIEndpoint), cnsi.AuthorizationEndpoint, cnsi.TokenEndpoint, cnsi.DopplerLoggingEndpoint, cnsi.SkipSSLValidation, cnsi.MetricsEndpoint, guid); err != nil {
		return fmt.Errorf("Unable to Save CNSI record: %v", err)
	}

	return nil
}

// Delete - Persist a CNSI Record to a datastore
func (p *PostgresCNSIRepository) Delete(guid string) error {
	log.Println("Delete")
	if _, err := p.db.Exec(deleteCNSI, guid); err != nil {
		return fmt.Errorf("Unable to Delete CNSI record: %v", err)
	}

	return nil
}

//// GetCNSIType - TBD
//func GetCNSIType(cnsi string) (CNSIType, error) {
//	log.Println("GetCNSIType")
//
//	var newType CNSIType
//
//	switch cnsi {
//	case
//		"cf",
//		"hce",
//		"hsm":
//		return CNSIType(cnsi), nil
//	}
//	return newType, errors.New("Invalid string passed to GetCNSIType.")
//}
