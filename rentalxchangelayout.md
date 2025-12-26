Use the following Experian Rental Exchange fixed-width layout when building the export. Field positions and lengths must be respected exactly. Treat this as the canonical format.

The export file is a fixed-width text file with:

1 Header record (H)

N Detail records (D) – one per tenant/tenancy

1 Trailer record (T)

Each line is a single record with fields at exact positions.

🔹 1. Header Record (H)

Represents the submitting organisation.

Pos	Len	Field	Notes
1	1	Record Type	Always H
2–11	10	Organisation ID	Supplied by Experian
12–41	30	Organisation Name	“RentLedger Ltd”
42–49	8	Creation Date	YYYYMMDD
50–55	6	Creation Time	HHMMSS
56–61	6	File Sequence	Incrementing
62–80	19	Filler	Spaces
🔹 2. Detail Record (D)

One row per tenant/tenancy.

Pos	Len	Field	Notes
1	1	Record Type	Always D
2–31	30	Surname	
32–61	30	Forename	
62–91	30	Middle Name	
92–99	8	Date of Birth	YYYYMMDD
100–129	30	Addr Line 1	
130–159	30	Addr Line 2	
160–189	30	Addr Line 3	
190–219	30	Addr Line 4	
220–227	8	Postcode	
228–235	8	Tenancy Start	YYYYMMDD
236–243	8	Tenancy End	YYYYMMDD or spaces
244–251	8	Rent Amount	In pence, zero-padded
252	1	Rent Frequency	M = monthly
253–260	8	Balance	In pence (arrears)
261	1	Payment Status	0=up to date, 1=arrears
262	1	Gone Away Flag	Y/N
263	1	Arrangement Flag	Y/N
264	1	Query Flag	Y/N
265	1	Deceased Flag	Y/N
266	1	Third Party Paid	Y/N
267	1	Evicted	Y/N
268–275	8	Eviction Date	YYYYMMDD
276–285	10	Account Ref	Your internal ref
286–300	15	Filler	

All unused fields must be space-filled.
Dates must be valid or blank.
Monetary values = integer pence, no decimals.

🔹 3. Trailer Record (T)

Summarises the file.

Pos	Len	Field	Notes
1	1	Record Type	Always T
2–11	10	Organisation ID	
12–21	10	Record Count	Number of D rows
22–31	10	Total Balance	Sum of balances (pence)
32–80	49	Filler	
🧠 Mapping logic Cursor must follow

One Detail record per active tenancy per month.

If tenant opted out → exclude.

Balance = sum of unpaid rent.

Payment Status:

0 if balance = 0

1 if balance > 0

Dates blank if unknown.

File must validate before export.