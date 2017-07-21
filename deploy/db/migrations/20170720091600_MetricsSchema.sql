-- +goose Up
-- SQL in section 'Up' is executed when this migration is applied

-- Store metrics endpoint with cnsis
ALTER TABLE cnsis
ADD metrics_endpoint VARCHAR(255);