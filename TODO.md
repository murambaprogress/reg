# Database and API Routing Fixes

## Issues Identified:
1. ❌ Database Error: Unknown column 'billing_invoice.service_description' in 'field list'
2. ❌ API Routing Error: 404 for /api/api/customers/ (double api prefix)

## Phase 1: Fix Database Schema Issue
- [ ] Create migration to add back service_description field to Invoice model
- [ ] Run the migration to update database schema
- [ ] Verify field exists in database

## Phase 2: Fix API Routing Issues
- [ ] Check axios base URL configuration
- [ ] Standardize customer API endpoints in billing.js
- [ ] Ensure consistent API routing

## Phase 3: Testing and Verification
- [ ] Test invoice API with service_description field
- [ ] Test customer API routing
- [ ] Verify no more 404 errors

## Files to be Modified:
- backend/billing/migrations/ (new migration)
- src/api/billing.js (fix customer API calls)
- src/utils/axios.js (check base URL)
