package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// Open the database
	db, err := sql.Open("sqlite3", "database.db")
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Delete all SSH keys
	result, err := db.Exec("DELETE FROM ssh_keys")
	if err != nil {
		log.Fatalf("Failed to delete SSH keys: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Fatalf("Failed to get rows affected: %v", err)
	}

	fmt.Printf("Successfully deleted %d SSH keys\n", rowsAffected)
}
