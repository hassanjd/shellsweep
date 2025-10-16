# TODO: Enhance Port Scanner Details

- [x] Add assess_threat function to evaluate security risks for ports and services
- [x] Modify parse_nmap_output to include threat, threat_description, and recommended_action fields for open ports
- [x] Test the backend changes to ensure JSON response includes new fields
- [x] Add currentScanId state to track scan ID for export functionality
- [x] Implement handleExportReport function to download PDF reports
- [x] Update handleStartScan to set currentScanId from API response
