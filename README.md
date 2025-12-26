
# RentLedger

## Experian Rental Exchange Integration (Batch-Ready)

This project includes a batch-ready integration for the Experian Rental Exchange v2.5.

### Features
- **Shared Tenancy Support**: Tenants can specify joint tenancy details.
- **Payment Status Calculation**: Automated calculation of Experian status codes (0-6, 8, U).
- **Batch Export**: Generates fixed-width files compliant with Experian v2.5 specifications.
- **Scheduling**: Automated monthly generation (1st of month at 02:00 AM).
- **Admin Interface**: UI for manual generation and download of export packs.

### Configuration
Ensure the following environment variables are set (optional, defaults used if missing):
- `EXPERIAN_SUPPLIER_ID`: Your Experian Supplier ID (e.g. `123456`). Currently a placeholder in code.

### Usage
1. **Manual Generation**: Log in as Admin -> Reporting -> New Batch.
2. **Download**: Download the generated `.txt` file for upload to Experian (SFT/Portal).
3. **Validation**: The system validates records during generation and flags missing DOB/Address/Names.

### Validation Rules
Records are checked for:
- Full Name (First & Last)
- Date of Birth (Required for matching)
- Property Address
- Valid Rent Amount

### Testing
Run unit tests for the export logic:
```bash
npm test
```
