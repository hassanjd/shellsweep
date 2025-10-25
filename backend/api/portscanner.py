from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
import subprocess
import re
import json
from typing import List, Dict
import logging
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
import io

router = APIRouter()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Scan results cache
scan_results = {}
current_scan = None

def nmap_quick_scan(target: str) -> List[Dict]:
    """Quick scan - Top 100 ports"""
    try:
        cmd = ["C:\\Program Files (x86)\\Nmap\\nmap.exe", "-T4", "--top-ports", "100", "-oG", "-", target]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        logger.info(f"Raw nmap output: {result.stdout}")
        return parse_nmap_output(result.stdout)
    except subprocess.TimeoutExpired:
        raise Exception("Scan timed out")
    except Exception as e:
        raise Exception(f"Quick scan failed: {str(e)}")

def nmap_full_scan(target: str) -> List[Dict]:
    """Full scan - All ports"""
    try:
        cmd = ["C:\\Program Files (x86)\\Nmap\\nmap.exe", "-T4", "-p-", "-oG", "-", target]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)  # 30 min timeout
        return parse_nmap_output(result.stdout)
    except subprocess.TimeoutExpired:
        raise Exception("Scan timed out")
    except Exception as e:
        raise Exception(f"Full scan failed: {str(e)}")

def nmap_detailed_scan(target: str, service_detection: bool = False, os_detection: bool = False) -> List[Dict]:
    """Detailed scan with service and OS detection options"""
    try:
        cmd = ["C:\\Program Files (x86)\\Nmap\\nmap.exe", "-T4", "-sS", "-oG", "-", target]

        # Add service detection if requested
        if service_detection:
            cmd.append("-sV")

        # Add OS detection if requested (requires root privileges)
        if os_detection:
            cmd.append("-O")

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        return parse_nmap_output(result.stdout)
    except subprocess.TimeoutExpired:
        raise Exception("Scan timed out")
    except Exception as e:
        raise Exception(f"Detailed scan failed: {str(e)}")

def assess_threat(port: int, service: str, state: str) -> tuple[bool, str, str]:
    """Assess if a port poses a security threat and provide recommendations"""
    if state.lower() != "open":
        return False, "", ""

    threat_ports = {
        22: ("SSH", "SSH port open - potential brute force attacks, check for reverse SSH tunnels"),
        23: ("Telnet", "Telnet port open - insecure protocol, passwords sent in plain text"),
        3389: ("RDP", "RDP port open - potential remote desktop vulnerabilities"),
        445: ("SMB", "SMB port open - vulnerable to exploits like EternalBlue"),
        80: ("HTTP", "HTTP port open - consider upgrading to HTTPS, check for HTTP reverse shells"),
        21: ("FTP", "FTP port open - insecure file transfer protocol"),
        25: ("SMTP", "SMTP port open - potential for email spoofing"),
        53: ("DNS", "DNS port open - check for DNS amplification attacks and DNS tunneling reverse shells"),
        1433: ("MSSQL", "MSSQL port open - potential SQL injection vulnerabilities"),
        3306: ("MySQL", "MySQL port open - ensure proper authentication"),
        5432: ("PostgreSQL", "PostgreSQL port open - secure database access"),
        6379: ("Redis", "Redis port open - potential unauthorized access"),
        27017: ("MongoDB", "MongoDB port open - ensure authentication is enabled"),
        8080: ("HTTP-Alt", "HTTP-Alt port open - consider securing web services, check for HTTP reverse shells"),
        8443: ("HTTPS-Alt", "HTTPS-Alt port open - verify SSL/TLS configuration, check for HTTPS reverse shells"),
        # Reverse shell specific ports
        4444: ("Reverse Shell", "Common Metasploit reverse shell port - HIGH RISK"),
        6667: ("IRC Reverse", "IRC-based reverse shells - HIGH RISK"),
        9001: ("Reverse Shell", "Common reverse shell port - HIGH RISK"),
        1337: ("Leet Reverse", "Leet reverse shell port - HIGH RISK"),
        31337: ("Elite Reverse", "Elite reverse shell port - HIGH RISK"),
    }

    threat_services = {
        "ssh": ("SSH service detected - secure with key-based authentication and fail2ban"),
        "telnet": ("Telnet service - replace with SSH for security"),
        "rdp": ("RDP service - use strong passwords and enable NLA"),
        "ftp": ("FTP service - use SFTP or FTPS instead"),
        "smb": ("SMB service - keep updated and restrict access"),
        "http": ("HTTP service - implement HTTPS"),
        "mysql": ("MySQL service - use strong passwords and limit remote access"),
        "postgresql": ("PostgreSQL service - configure proper authentication"),
        "redis": ("Redis service - require authentication and bind to localhost"),
        "mongodb": ("MongoDB service - enable authentication and authorization"),
    }

    if port in threat_ports:
        service_name, description = threat_ports[port]
        recommendation = f"Port {port} ({service_name}) is open. {description}. Recommended actions: Close if not needed, use firewall rules, keep software updated, and check for reverse shell vulnerabilities."
        return True, description, recommendation

    service_lower = service.lower()
    if service_lower in threat_services:
        recommendation = threat_services[service_lower]
        return True, f"{service} service detected - potential security risk", f"{service} service detected. {recommendation}. Check for reverse shell vulnerabilities."

    return False, "", ""

def parse_nmap_output(output: str) -> List[Dict]:
    """Parse nmap -oG (grepable) format output"""
    ports_data = []

    for line in output.split('\n'):
        if line.startswith('Host:'):
            parts = line.split()
            if len(parts) < 2:
                continue

            ip = parts[1]

            # Find ports section
            ports_section = None
            for i, part in enumerate(parts):
                if part.startswith('Ports:'):
                    ports_section = ' '.join(parts[i:])
                    break

            if ports_section:
                # Extract ports information
                ports_match = re.findall(r'(\d+)/(\w+)/(\w+)/([^/]*)/([^/]*)/([^/]*)/([^,]+)', ports_section)
                for port_match in ports_match:
                    port, state, protocol, service, version, *_ = port_match

                    port_info = {
                        "ip": ip,
                        "port": int(port),
                        "protocol": protocol.upper(),
                        "state": state.capitalize(),
                        "service": service if service != "" else "Unknown",
                        "version": version.strip('/') if version.strip('/') != "" else "Unknown"
                    }

                    # Assess threat
                    is_threat, threat_desc, recommendation = assess_threat(int(port), service, state)
                    port_info["threat"] = is_threat
                    port_info["threat_description"] = threat_desc
                    port_info["recommended_action"] = recommendation

                    ports_data.append(port_info)

    return ports_data

def generate_pdf_report(scan_data: Dict) -> io.BytesIO:
    """Generate a PDF report for the scan results"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    title = Paragraph("Port Scanner Report", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))

    # Scan Information
    scan_info = [
        ["Scan Target:", scan_data.get('target', 'N/A')],
        ["Scan Type:", scan_data.get('scan_type', 'N/A')],
        ["Service Detection:", "Enabled" if scan_data.get('service_detection') else "Disabled"],
        ["OS Detection:", "Enabled" if scan_data.get('os_detection') else "Disabled"],
        ["Timestamp:", scan_data.get('timestamp', 'N/A')],
        ["Total Ports Found:", str(len(scan_data.get('results', [])))]
    ]

    scan_table = Table(scan_info, colWidths=[2*inch, 4*inch])
    scan_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(scan_table)
    elements.append(Spacer(1, 20))

    # Ports Table
    results = scan_data.get('results', [])
    if results:
        # Table headers
        data = [['IP Address', 'Port', 'Protocol', 'State', 'Service', 'Version', 'Threat']]

        # Table data
        for port in results:
            threat_status = "Yes" if port.get('threat', False) else "No"
            data.append([
                port.get('ip', ''),
                str(port.get('port', '')),
                port.get('protocol', ''),
                port.get('state', ''),
                port.get('service', ''),
                port.get('version', ''),
                threat_status
            ])

        # Create table
        ports_table = Table(data, colWidths=[1.5*inch, 0.8*inch, 0.8*inch, 0.8*inch, 1.2*inch, 1.2*inch, 0.6*inch])
        ports_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(ports_table)
        elements.append(Spacer(1, 20))

        # Security Recommendations
        threat_ports = [port for port in results if port.get('threat', False)]
        if threat_ports:
            elements.append(Paragraph("Security Recommendations", styles['Heading2']))
            elements.append(Spacer(1, 12))

            for port in threat_ports:
                rec_text = f"Port {port.get('port', '')} ({port.get('service', '')}): {port.get('recommended_action', '')}"
                elements.append(Paragraph(rec_text, styles['Normal']))
                elements.append(Spacer(1, 6))

    doc.build(elements)
    buffer.seek(0)
    return buffer

@router.post('/api/scan')
async def start_scan(scan_config: dict):
    """Start a port scan with given configuration"""
    global current_scan

    try:
        if not scan_config:
            raise HTTPException(status_code=400, detail="No JSON data provided")

        target = scan_config.get("target", "").strip()
        scan_type = scan_config.get("scanType", "quick")
        service_detection = scan_config.get("serviceDetection", False)
        os_detection = scan_config.get("osDetection", False)

        if not target:
            raise HTTPException(status_code=400, detail="Target IP or range is required")

        logger.info(f"Starting {scan_type} scan for target: {target}")

        # Execute scan based on type
        if scan_type == "quick":
            results = nmap_quick_scan(target)
        elif scan_type == "full":
            results = nmap_full_scan(target)
        elif scan_type == "detailed":
            results = nmap_detailed_scan(target, service_detection, os_detection)
        else:
            raise HTTPException(status_code=400, detail="Invalid scan type")

        # Cache results
        scan_id = datetime.now().isoformat()
        scan_results[scan_id] = {
            "scan_id": scan_id,
            "target": target,
            "scan_type": scan_type,
            "service_detection": service_detection,
            "os_detection": os_detection,
            "results": results,
            "timestamp": datetime.now().isoformat()
        }

        current_scan = scan_id

        return JSONResponse(content={
            "scan_id": scan_id,
            "target": target,
            "scan_type": scan_type,
            "results": results,
            "total_ports_found": len(results)
        })

    except Exception as e:
        logger.error(f"Scan error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

@router.get('/api/scan/{scan_id}')
async def get_scan_results(scan_id: str):
    """Get results for a specific scan"""
    if scan_id in scan_results:
        return JSONResponse(content=scan_results[scan_id])
    else:
        raise HTTPException(status_code=404, detail="Scan not found")

@router.get('/api/current-scan')
async def get_current_scan():
    """Get the most recent scan results"""
    if current_scan and current_scan in scan_results:
        return JSONResponse(content=scan_results[current_scan])
    else:
        raise HTTPException(status_code=404, detail="No recent scan found")

@router.get('/api/scan-history')
async def get_scan_history():
    """Get history of all scans"""
    return JSONResponse(content={
        "scans": list(scan_results.values()),
        "total_scans": len(scan_results)
    })

@router.get('/api/export-report/{scan_id}')
async def export_report(scan_id: str):
    """Export scan results as PDF report"""
    if scan_id not in scan_results:
        raise HTTPException(status_code=404, detail="Scan not found")

    scan_data = scan_results[scan_id]
    pdf_buffer = generate_pdf_report(scan_data)

    # Generate filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"port_scan_report_{timestamp}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_buffer.getvalue()),
        media_type='application/pdf',
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get('/api/health')
async def health():
    return JSONResponse(content={"message": "Port Scanner API is running", "status": "active"})
