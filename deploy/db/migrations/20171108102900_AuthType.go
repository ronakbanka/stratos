package main

import (
	"database/sql"
	"fmt"
)

func Up_20171108102900(txn *sql.Tx) {

	createTokens := "ALTER TABLE  tokens "
	createTokens += "ADD auth_type VARCHAR(255) DEFAULT \"OAuth2\", "
	createTokens += "ADD meta_data     TEXT "
	createTokens += ";"

	_, err := txn.Exec(createTokens)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	cnsiUpdate := "ALTER TABLE cnsis "
	createTokens += "ADD auth_type VARCHAR(255) DEFAULT \"OAuth2\", "
	cnsiUpdate += "CHANGE column cnsi_type cnsi_type VARCHAR(255)"
	cnsiUpdate += ";"

	_, err = txn.Exec(cnsiUpdate)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}

}

func Down_20171108102900(txn *sql.Tx) {
	dropTables := "DROP  TABLE IF EXISTS tokens;"
	_, err := txn.Exec(dropTables)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
	dropTables = "DROP  TABLE IF EXISTS cnsis;"
	_, err = txn.Exec(dropTables)
	if err != nil {
		fmt.Printf("Failed to migrate due to: %v", err)
	}
}
