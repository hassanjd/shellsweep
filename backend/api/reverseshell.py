from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
import subprocess
import re
import json
import logging
from typing import List, Dict, Tuple
from datetime import datetime
import psutil
import socket
import threading
import time
import nmap

router = APIRouter()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Detection results cache
detection_results = {}
current_detection = None

# Known reverse shell indicators - Only truly suspicious ports
REVERSE_SHELL_PORTS = {
    4444: "Common Metasploit reverse shell port",
    6667: "IRC-based reverse shells",
    9001: "Common reverse shell port",
    1337: "Leet reverse shell port",
    31337: "Elite reverse shell port",
    9999: "Common reverse shell port",
    5555: "Android reverse shell port",
    7777: "BSD reverse shell port",
    8888: "Alternative reverse shell port",
    9998: "Common reverse shell port"
}

# Legitimate ports that should not be flagged
LEGITIMATE_PORTS = {22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3389, 5900}

# Suspicious processes - More specific, excluding common legitimate tools
SUSPICIOUS_PROCESSES = [
    "meterpreter", "msfvenom", "empire", "cobaltstrike", "beacon",
    "reverse_tcp", "reverse_http", "reverse_https"
]

# Common legitimate processes that should be whitelisted by default
# Note: We avoid whitelisting digitally signed Windows processes that could be exploited
LEGITIMATE_PROCESSES = {
    # Web browsers
    "chrome.exe", "firefox.exe", "edge.exe", "safari.exe", "opera.exe",
    # Development tools
    "code.exe", "idea.exe", "pycharm.exe", "vscode.exe", "sublime_text.exe",
    # Programming languages
    "python.exe", "python3.exe", "node.exe", "java.exe", "javaw.exe",
    # Shell environments
    "bash", "zsh", "fish", "powershell.exe", "cmd.exe",
    # Package managers and build tools
    "npm", "yarn", "pip", "git.exe", "svn.exe",
    # Database clients
    "mysql.exe", "psql.exe", "sqlite3.exe", "mongod.exe",
    # Text editors
    "notepad.exe", "notepad++.exe", "vim.exe", "emacs.exe",
    # Media players
    "vlc.exe", "mpv.exe", "mplayer.exe",
    # Office applications
    "winword.exe", "excel.exe", "powerpnt.exe", "outlook.exe",
    # System utilities (carefully selected)
    "explorer.exe",  # File explorer is generally safe
    # Development servers
    "httpd.exe", "nginx.exe", "apache.exe", "tomcat.exe",
    # Virtualization (generally safe)
    "vmware.exe", "virtualbox.exe", "hyperv.exe"
}

# User-defined whitelist (can be configured)
PROCESS_WHITELIST = set()
CONNECTION_WHITELIST = set()

def calculate_connection_score(conn, process_info: Dict = None) -> Tuple[int, str, str]:
    """Calculate risk score for a network connection (0-100)"""
    score = 0
    reasons = []
    risk_level = "low"

    if not conn.raddr:
        return 0, "low", "No remote address"

    remote_ip = conn.raddr.ip
    remote_port = conn.raddr.port

    # Skip whitelisted connections
    connection_key = f"{remote_ip}:{remote_port}"
    if connection_key in CONNECTION_WHITELIST:
        return 0, "low", "Whitelisted connection"

    # Skip legitimate ports
    if remote_port in LEGITIMATE_PORTS:
        return 0, "low", f"Legitimate port ({remote_port})"

    # High risk: Known reverse shell ports
    if remote_port in REVERSE_SHELL_PORTS:
        score += 80
        reasons.append(f"Known reverse shell port: {remote_port}")
        risk_level = "high"

    # Medium risk: Non-private IP connections
    if not remote_ip.startswith(('192.168.', '10.', '172.', '127.')):
        score += 30
        reasons.append("External IP connection")
        if risk_level == "low":
            risk_level = "medium"

    # Additional context from process
    if process_info:
        proc_name = process_info.get('name', '').lower()

        # Suspicious process making connection
        if any(susp in proc_name for susp in SUSPICIOUS_PROCESSES):
            score += 40
            reasons.append(f"Suspicious process: {proc_name}")
            risk_level = "high"

        # Legitimate process gets score reduction
        elif proc_name in LEGITIMATE_PROCESSES:
            score = max(0, score - 20)
            reasons.append(f"Legitimate process: {proc_name}")

        # Check for unusual connection patterns
        if process_info.get('cpu_percent', 0) > 50:
            score += 15
            reasons.append("High CPU usage process")

    # Cap score at 100
    score = min(100, score)

    # Adjust risk level based on final score
    if score >= 70:
        risk_level = "high"
    elif score >= 30:
        risk_level = "medium"
    else:
        risk_level = "low"

    return score, risk_level, "; ".join(reasons) if reasons else "Low risk connection"

def detect_reverse_shell_connections() -> List[Dict]:
    """Detect potentially malicious outbound connections with scoring"""
    suspicious_connections = []

    try:
        connections = psutil.net_connections(kind='inet')

        for conn in connections:
            if conn.status == 'ESTABLISHED':
                local_addr = f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else "unknown"
                remote_addr = f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else "unknown"

                # Get process information
                process_info = None
                if conn.pid:
                    try:
                        proc = psutil.Process(conn.pid)
                        process_info = {
                            'name': proc.name(),
                            'cpu_percent': proc.cpu_percent(),
                            'memory_percent': proc.memory_percent()
                        }
                    except:
                        pass

                # Calculate risk score
                score, risk_level, reasons = calculate_connection_score(conn, process_info)

                # Only report connections with score > 20 (filter out noise)
                if score > 20:
                    suspicious_connections.append({
                        "type": "network_connection",
                        "local_address": local_addr,
                        "remote_address": remote_addr,
                        "port": conn.raddr.port if conn.raddr else None,
                        "description": reasons,
                        "process": get_process_info(conn.pid) if conn.pid else "Unknown",
                        "risk_score": score,
                        "risk_level": risk_level,
                        "timestamp": datetime.now().isoformat()
                    })

    except Exception as e:
        logger.error(f"Error detecting connections: {str(e)}")

    return suspicious_connections

def calculate_process_score(proc_info: Dict) -> Tuple[int, str, str]:
    """Calculate risk score for a process (0-100)"""
    score = 0
    reasons = []
    risk_level = "low"

    proc_name = proc_info.get('name', '').lower()
    cmdline = proc_info.get('cmdline', [])
    username = proc_info.get('username', '')

    # Skip whitelisted processes
    if proc_name in PROCESS_WHITELIST or proc_name in LEGITIMATE_PROCESSES:
        return 0, "low", "Whitelisted or legitimate process"

    # High risk: Known malicious process names
    if any(susp in proc_name for susp in SUSPICIOUS_PROCESSES):
        score += 90
        reasons.append(f"Known malicious process: {proc_name}")
        risk_level = "high"

    # High risk: Suspicious command line patterns
    if cmdline:
        cmdline_str = ' '.join(cmdline)
        if detect_reverse_shell_cmdline(cmdline_str):
            score += 85
            reasons.append("Reverse shell command pattern detected")
            risk_level = "high"

    # Medium risk: Unusual parent-child relationships
    try:
        proc = psutil.Process(proc_info['pid'])
        parent = proc.parent()
        if parent:
            parent_name = parent.name().lower()
            # Suspicious if system process spawns unusual child
            if parent_name in ['svchost.exe', 'services.exe', 'lsass.exe'] and proc_name not in LEGITIMATE_PROCESSES:
                score += 40
                reasons.append(f"Unusual parent-child relationship: {parent_name} -> {proc_name}")
                if risk_level == "low":
                    risk_level = "medium"
    except:
        pass

    # Medium risk: High resource usage with suspicious characteristics
    try:
        cpu_percent = proc_info.get('cpu_percent', 0)
        memory_percent = proc_info.get('memory_percent', 0)

        if cpu_percent > 80:
            score += 25
            reasons.append(f"Very high CPU usage: {cpu_percent:.1f}%")
            if risk_level == "low":
                risk_level = "medium"

        if memory_percent > 50:
            score += 20
            reasons.append(f"High memory usage: {memory_percent:.1f}%")
            if risk_level == "low":
                risk_level = "medium"
    except:
        pass

    # Low risk: Non-system user running system-like processes
    if username and username not in ['SYSTEM', 'LOCAL SERVICE', 'NETWORK SERVICE', 'root', 'administrator']:
        system_processes = ['svchost.exe', 'lsass.exe', 'winlogon.exe', 'csrss.exe']
        if proc_name in system_processes:
            score += 15
            reasons.append(f"Non-system user running system process: {username}")
            if risk_level == "low":
                risk_level = "low"

    # Cap score at 100
    score = min(100, score)

    # Adjust risk level based on final score
    if score >= 70:
        risk_level = "high"
    elif score >= 30:
        risk_level = "medium"
    else:
        risk_level = "low"

    return score, risk_level, "; ".join(reasons) if reasons else "Low risk process"

def detect_suspicious_processes() -> List[Dict]:
    """Detect processes with comprehensive scoring"""
    suspicious_procs = []

    try:
        for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'username', 'create_time', 'cpu_percent', 'memory_percent']):
            try:
                proc_info = proc.info

                # Calculate risk score
                score, risk_level, reasons = calculate_process_score(proc_info)

                # Only report processes with score > 30 (filter out noise)
                if score > 30:
                    suspicious_procs.append({
                        "type": "process_analysis",
                        "pid": proc_info['pid'],
                        "name": proc_info['name'],
                        "cmdline": proc_info['cmdline'],
                        "username": proc_info['username'],
                        "description": reasons,
                        "risk_score": score,
                        "risk_level": risk_level,
                        "timestamp": datetime.now().isoformat()
                    })

            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

    except Exception as e:
        logger.error(f"Error detecting processes: {str(e)}")

    return suspicious_procs

def detect_reverse_shell_cmdline(cmdline: str) -> bool:
    """Check command line for reverse shell patterns"""
    suspicious_patterns = [
        r'nc\s+.*\s+\d+',  # netcat with port
        r'ncat\s+.*\s+\d+',  # ncat with port
        r'socat\s+.*\s+\d+',  # socat with port
        r'bash\s+-i\s+.*>&',  # bash reverse shell
        r'python\s+-c\s+.*socket',  # python reverse shell
        r'perl\s+-e\s+.*socket',  # perl reverse shell
        r'ruby\s+-e\s+.*socket',  # ruby reverse shell
        r'msfvenom',  # metasploit payload generator
        r'meterpreter',  # metasploit meterpreter
        r'reverse_tcp',  # common reverse shell type
        r'reverse_http',  # http reverse shell
        r'reverse_https',  # https reverse shell
        r'powershell.*-c.*iex',  # powershell reverse shell
        r'cmd\.exe.*powershell',  # cmd calling powershell
    ]

    for pattern in suspicious_patterns:
        if re.search(pattern, cmdline, re.IGNORECASE):
            return True

    return False

def is_suspicious_destination(ip: str) -> bool:
    """Check if destination IP is suspicious"""
    try:
        # Check if it's a private IP (less suspicious)
        if ip.startswith(('192.168.', '10.', '172.')):
            return False

        # Check for known malicious IP ranges (simplified)
        suspicious_ranges = [
            '185.0.0.0/8',  # Example suspicious range
            '45.0.0.0/8',   # Another example
        ]

        # For now, flag non-private IPs as potentially suspicious
        # In a real implementation, you'd check against threat intelligence feeds
        return not ip.startswith(('192.168.', '10.', '172.'))

    except:
        return False

def get_process_info(pid: int) -> Dict:
    """Get detailed process information"""
    try:
        proc = psutil.Process(pid)
        return {
            "pid": pid,
            "name": proc.name(),
            "cmdline": proc.cmdline(),
            "username": proc.username(),
            "create_time": datetime.fromtimestamp(proc.create_time()).isoformat(),
            "cpu_percent": proc.cpu_percent(),
            "memory_percent": proc.memory_percent()
        }
    except:
        return {"pid": pid, "error": "Could not retrieve process info"}

def detect_remote_reverse_shell(target_ip: str) -> Tuple[List[Dict], Dict]:
    """Detect potential reverse shell indicators on remote target using nmap"""
    remote_findings = []
    scan_details = {
        "target_ip": target_ip,
        "scan_time": datetime.now().isoformat(),
        "ports_scanned": list(REVERSE_SHELL_PORTS.keys()),
        "port_details": {}
    }

    try:
        # Initialize nmap scanner
        nm = nmap.PortScanner()

        # Scan for known reverse shell ports
        ports_to_scan = ','.join(map(str, REVERSE_SHELL_PORTS.keys()))

        logger.info(f"Scanning {target_ip} for reverse shell ports: {ports_to_scan}")

        # Perform the scan
        nm.scan(target_ip, ports_to_scan, arguments='-sV --version-intensity 5')

        logger.info(f"Nmap scan completed for {target_ip}. Hosts found: {nm.all_hosts()}")

        for host in nm.all_hosts():
            logger.info(f"Host {host} state: {nm[host].state()}")
            if nm[host].state() == 'up':
                logger.info(f"Scanning protocols for host {host}")
                for proto in nm[host].all_protocols():
                    logger.info(f"Protocol {proto} found with ports: {list(nm[host][proto].keys())}")
                    lport = nm[host][proto].keys()
                    for port in lport:
                        port_info = nm[host][proto][port]
                        state = port_info['state']
                        service = port_info.get('name', 'unknown')
                        version = port_info.get('version', 'unknown')

                        # Store detailed port information
                        scan_details["port_details"][port] = {
                            "state": state,
                            "service": service,
                            "version": version
                        }

                        logger.info(f"Port {port} state: {state}, service: {service}")

                        if state == 'open':
                            if port in REVERSE_SHELL_PORTS:
                                logger.info(f"Found open reverse shell port {port} on {target_ip}")
                                remote_findings.append({
                                    "type": "remote_port_scan",
                                    "target_ip": target_ip,
                                    "port": port,
                                    "service": service,
                                    "version": version,
                                    "description": f"Open reverse shell port: {REVERSE_SHELL_PORTS[port]}",
                                    "risk_score": 80,
                                    "risk_level": "high",
                                    "timestamp": datetime.now().isoformat()
                                })
                            else:
                                # Check for suspicious services on non-standard ports
                                if port > 1024 and service in ['unknown', 'tcpwrapped']:
                                    logger.info(f"Found suspicious open port {port} on {target_ip}")
                                    remote_findings.append({
                                        "type": "remote_port_scan",
                                        "target_ip": target_ip,
                                        "port": port,
                                        "service": service,
                                        "version": version,
                                        "description": f"Suspicious open port with unknown service",
                                        "risk_score": 40,
                                        "risk_level": "medium",
                                        "timestamp": datetime.now().isoformat()
                                    })

        # If no findings but host is up, add a scan completion entry
        if not remote_findings and nm.all_hosts():
            host = nm.all_hosts()[0]
            if nm[host].state() == 'up':
                logger.info(f"No suspicious ports found on {target_ip}, but host is reachable")
                remote_findings.append({
                    "type": "remote_port_scan",
                    "target_ip": target_ip,
                    "port": None,
                    "service": "scan_completed",
                    "version": "N/A",
                    "description": f"Host {target_ip} is reachable but no suspicious ports detected",
                    "risk_score": 0,
                    "risk_level": "low",
                    "timestamp": datetime.now().isoformat()
                })

    except Exception as e:
        logger.error(f"Error during remote scan of {target_ip}: {str(e)}")
        # Fallback to basic socket probing if nmap fails
        fallback_findings, fallback_details = detect_remote_reverse_shell_fallback(target_ip)
        remote_findings.extend(fallback_findings)
        scan_details.update(fallback_details)

    logger.info(f"Remote scan for {target_ip} completed with {len(remote_findings)} findings")
    return remote_findings, scan_details

def detect_remote_reverse_shell_fallback(target_ip: str) -> Tuple[List[Dict], Dict]:
    """Fallback remote detection using basic socket connections"""
    remote_findings = []
    scan_details = {
        "target_ip": target_ip,
        "scan_time": datetime.now().isoformat(),
        "ports_scanned": list(REVERSE_SHELL_PORTS.keys()),
        "port_details": {},
        "fallback_mode": True
    }

    try:
        for port, description in REVERSE_SHELL_PORTS.items():
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1.0)
                result = sock.connect_ex((target_ip, port))
                state = "open" if result == 0 else "closed"

                # Store port details
                scan_details["port_details"][port] = {
                    "state": state,
                    "service": "unknown",
                    "version": "unknown"
                }

                if result == 0:
                    remote_findings.append({
                        "type": "remote_port_scan",
                        "target_ip": target_ip,
                        "port": port,
                        "service": "unknown",
                        "version": "unknown",
                        "description": f"Open reverse shell port: {description}",
                        "risk_score": 80,
                        "risk_level": "high",
                        "timestamp": datetime.now().isoformat()
                    })
                sock.close()
            except:
                pass
    except Exception as e:
        logger.error(f"Error in fallback remote scan: {str(e)}")

    return remote_findings, scan_details

def perform_reverse_shell_scan(target_ip: str = None) -> Dict:
    """Perform comprehensive reverse shell detection scan"""
    logger.info("Starting reverse shell detection scan")

    # Determine if this is a remote scan
    is_remote_scan = target_ip and target_ip not in ['localhost', '127.0.0.1', '::1']

    results = {
        "scan_id": datetime.now().isoformat(),
        "timestamp": datetime.now().isoformat(),
        "target": target_ip or "localhost",
        "connections": [],
        "processes": [],
        "remote_findings": [],
        "network_traffic": [],  # Placeholder for future network traffic analysis
        "total_findings": 0,
        "risk_summary": {
            "high": 0,
            "medium": 0,
            "low": 0
        }
    }

    if is_remote_scan:
        # For remote scans, only perform remote detection
        logger.info(f"Performing remote scan on {target_ip}")
        remote_findings, scan_details = detect_remote_reverse_shell(target_ip)
        results["remote_findings"] = remote_findings
        results["scan_details"] = scan_details
    else:
        # For local scans, perform local detection
        logger.info("Performing local scan")
        results["connections"] = detect_reverse_shell_connections()
        results["processes"] = detect_suspicious_processes()

    # Calculate totals
    all_findings = results["connections"] + results["processes"] + results["remote_findings"]
    results["total_findings"] = len(all_findings)

    for finding in all_findings:
        risk = finding.get("risk_level", "low")
        if risk in results["risk_summary"]:
            results["risk_summary"][risk] += 1

    return results

@router.post('/api/reverse-shell/scan')
async def start_reverse_shell_scan(scan_config: dict = {}):
    """Start a reverse shell detection scan"""
    global current_detection

    try:
        target = scan_config.get("target", "localhost")

        logger.info(f"Starting reverse shell scan for target: {target}")

        # Perform the scan
        results = perform_reverse_shell_scan(target)

        # Cache results
        scan_id = results["scan_id"]
        detection_results[scan_id] = results
        current_detection = scan_id

        return JSONResponse(content={
            "scan_id": scan_id,
            "target": target,
            "total_findings": results["total_findings"],
            "risk_summary": results["risk_summary"],
            "results": results
        })

    except Exception as e:
        logger.error(f"Reverse shell scan error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

@router.get('/api/reverse-shell/scan/{scan_id}')
async def get_reverse_shell_results(scan_id: str):
    """Get results for a specific reverse shell scan"""
    if scan_id in detection_results:
        return JSONResponse(content=detection_results[scan_id])
    else:
        raise HTTPException(status_code=404, detail="Scan not found")

@router.get('/api/reverse-shell/current-scan')
async def get_current_reverse_shell_scan():
    """Get the most recent reverse shell scan results"""
    if current_detection and current_detection in detection_results:
        return JSONResponse(content=detection_results[current_detection])
    else:
        raise HTTPException(status_code=404, detail="No recent scan found")

@router.get('/api/reverse-shell/history')
async def get_reverse_shell_history():
    """Get history of all reverse shell scans"""
    return JSONResponse(content={
        "scans": list(detection_results.values()),
        "total_scans": len(detection_results)
    })

@router.get('/api/reverse-shell/health')
async def reverse_shell_health():
    return JSONResponse(content={"message": "Reverse Shell Detector API is running", "status": "active"})

@router.get('/api/reverse-shell/whitelist/process')
async def get_process_whitelist():
    """Get process whitelist"""
    return JSONResponse(content={
        "whitelisted_processes": list(PROCESS_WHITELIST),
        "legitimate_processes": list(LEGITIMATE_PROCESSES)
    })

@router.post('/api/reverse-shell/whitelist/process')
async def add_process_whitelist(process_data: dict):
    """Add process to whitelist"""
    global PROCESS_WHITELIST
    process_name = process_data.get('process_name', '').lower().strip()
    if process_name:
        PROCESS_WHITELIST.add(process_name)
        return JSONResponse(content={"message": f"Process '{process_name}' added to whitelist"})
    raise HTTPException(status_code=400, detail="Process name required")

@router.delete('/api/reverse-shell/whitelist/process')
async def remove_process_whitelist(process_data: dict):
    """Remove process from whitelist"""
    global PROCESS_WHITELIST
    process_name = process_data.get('process_name', '').lower().strip()
    if process_name in PROCESS_WHITELIST:
        PROCESS_WHITELIST.remove(process_name)
        return JSONResponse(content={"message": f"Process '{process_name}' removed from whitelist"})
    raise HTTPException(status_code=404, detail="Process not in whitelist")

@router.get('/api/reverse-shell/whitelist/connection')
async def get_connection_whitelist():
    """Get connection whitelist"""
    return JSONResponse(content={"whitelisted_connections": list(CONNECTION_WHITELIST)})

@router.post('/api/reverse-shell/whitelist/connection')
async def add_connection_whitelist(connection_data: dict):
    """Add connection to whitelist"""
    global CONNECTION_WHITELIST
    ip = connection_data.get('ip', '').strip()
    port = connection_data.get('port')
    if ip and port is not None:
        connection_key = f"{ip}:{port}"
        CONNECTION_WHITELIST.add(connection_key)
        return JSONResponse(content={"message": f"Connection '{connection_key}' added to whitelist"})
    raise HTTPException(status_code=400, detail="IP and port required")

@router.delete('/api/reverse-shell/whitelist/connection')
async def remove_connection_whitelist(connection_data: dict):
    """Remove connection from whitelist"""
    global CONNECTION_WHITELIST
    ip = connection_data.get('ip', '').strip()
    port = connection_data.get('port')
    if ip and port is not None:
        connection_key = f"{ip}:{port}"
        if connection_key in CONNECTION_WHITELIST:
            CONNECTION_WHITELIST.remove(connection_key)
            return JSONResponse(content={"message": f"Connection '{connection_key}' removed from whitelist"})
        raise HTTPException(status_code=404, detail="Connection not in whitelist")
    raise HTTPException(status_code=400, detail="IP and port required")

@router.get('/api/reverse-shell/config')
async def get_detection_config():
    """Get current detection configuration"""
    return JSONResponse(content={
        "reverse_shell_ports": list(REVERSE_SHELL_PORTS.keys()),
        "legitimate_ports": list(LEGITIMATE_PORTS),
        "suspicious_processes": SUSPICIOUS_PROCESSES,
        "legitimate_processes": list(LEGITIMATE_PROCESSES),
        "whitelisted_processes": list(PROCESS_WHITELIST),
        "whitelisted_connections": list(CONNECTION_WHITELIST),
        "scoring_thresholds": {
            "connection_min_score": 20,
            "process_min_score": 30,
            "high_risk_threshold": 70,
            "medium_risk_threshold": 30
        }
    })
