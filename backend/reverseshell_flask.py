from flask import Blueprint, request, jsonify
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

bp = Blueprint('reverseshell', __name__)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Detection results cache
detection_results = {}
current_detection = None

# Known reverse shell indicators
REVERSE_SHELL_PORTS = {
    4444: "Common Metasploit reverse shell port",
    6667: "IRC-based reverse shells",
    9001: "Common reverse shell port",
    1337: "Leet reverse shell port",
    31337: "Elite reverse shell port",
    53: "DNS tunneling reverse shells",
    80: "HTTP-based reverse shells",
    443: "HTTPS-based reverse shells",
    22: "SSH reverse tunnels",
    23: "Telnet reverse connections",
    25: "SMTP reverse connections",
    110: "POP3 reverse connections",
    143: "IMAP reverse connections",
    993: "IMAPS reverse connections",
    995: "POP3S reverse connections"
}

SUSPICIOUS_PROCESSES = [
    "nc", "netcat", "ncat", "socat", "bash", "sh", "python", "perl", "ruby",
    "powershell", "cmd.exe", "meterpreter", "msfvenom", "empire", "cobaltstrike",
    "beacon", "shell", "reverse", "tunnel", "proxy", "socks"
]

def detect_reverse_shell_connections() -> List[Dict]:
    """Detect potentially malicious outbound connections that could indicate reverse shells"""
    suspicious_connections = []

    try:
        # Get all network connections
        connections = psutil.net_connections(kind='inet')

        for conn in connections:
            if conn.status == 'ESTABLISHED':
                local_addr = f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else "unknown"
                remote_addr = f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else "unknown"

                # Check for suspicious remote ports
                if conn.raddr and conn.raddr.port in REVERSE_SHELL_PORTS:
                    suspicious_connections.append({
                        "type": "suspicious_port",
                        "local_address": local_addr,
                        "remote_address": remote_addr,
                        "port": conn.raddr.port,
                        "description": REVERSE_SHELL_PORTS[conn.raddr.port],
                        "process": get_process_info(conn.pid) if conn.pid else "Unknown",
                        "risk_level": "high",
                        "timestamp": datetime.now().isoformat()
                    })

                # Check for connections to unusual destinations
                elif conn.raddr and is_suspicious_destination(conn.raddr.ip):
                    suspicious_connections.append({
                        "type": "suspicious_destination",
                        "local_address": local_addr,
                        "remote_address": remote_addr,
                        "port": conn.raddr.port,
                        "description": "Connection to potentially malicious IP",
                        "process": get_process_info(conn.pid) if conn.pid else "Unknown",
                        "risk_level": "medium",
                        "timestamp": datetime.now().isoformat()
                    })

    except Exception as e:
        logger.error(f"Error detecting connections: {str(e)}")

    return suspicious_connections

def detect_suspicious_processes() -> List[Dict]:
    """Detect processes that might be running reverse shells"""
    suspicious_procs = []

    try:
        for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'username', 'create_time']):
            try:
                proc_info = proc.info

                # Check process name
                if proc_info['name'] and any(susp in proc_info['name'].lower() for susp in SUSPICIOUS_PROCESSES):
                    suspicious_procs.append({
                        "type": "suspicious_process_name",
                        "pid": proc_info['pid'],
                        "name": proc_info['name'],
                        "cmdline": proc_info['cmdline'],
                        "username": proc_info['username'],
                        "description": f"Suspicious process name: {proc_info['name']}",
                        "risk_level": "high",
                        "timestamp": datetime.now().isoformat()
                    })

                # Check command line for suspicious patterns
                elif proc_info['cmdline']:
                    cmdline_str = ' '.join(proc_info['cmdline'])
                    if detect_reverse_shell_cmdline(cmdline_str):
                        suspicious_procs.append({
                            "type": "suspicious_cmdline",
                            "pid": proc_info['pid'],
                            "name": proc_info['name'],
                            "cmdline": proc_info['cmdline'],
                            "username": proc_info['username'],
                            "description": f"Suspicious command line pattern detected",
                            "risk_level": "high",
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

def perform_reverse_shell_scan(target_ip: str = None) -> Dict:
    """Perform comprehensive reverse shell detection scan"""
    logger.info("Starting reverse shell detection scan")

    results = {
        "scan_id": datetime.now().isoformat(),
        "timestamp": datetime.now().isoformat(),
        "target": target_ip or "localhost",
        "connections": detect_reverse_shell_connections(),
        "processes": detect_suspicious_processes(),
        "network_traffic": [],  # Placeholder for future network traffic analysis
        "total_findings": 0,
        "risk_summary": {
            "high": 0,
            "medium": 0,
            "low": 0
        }
    }

    # Calculate totals
    all_findings = results["connections"] + results["processes"]
    results["total_findings"] = len(all_findings)

    for finding in all_findings:
        risk = finding.get("risk_level", "low")
        if risk in results["risk_summary"]:
            results["risk_summary"][risk] += 1

    return results

@bp.route('/api/reverse-shell/scan', methods=['POST'])
def start_reverse_shell_scan():
    """Start a reverse shell detection scan"""
    global current_detection

    try:
        scan_config = request.get_json() or {}
        target = scan_config.get("target", "localhost")

        logger.info(f"Starting reverse shell scan for target: {target}")

        # Perform the scan
        results = perform_reverse_shell_scan(target)

        # Cache results
        scan_id = results["scan_id"]
        detection_results[scan_id] = results
        current_detection = scan_id

        return jsonify({
            "scan_id": scan_id,
            "target": target,
            "total_findings": results["total_findings"],
            "risk_summary": results["risk_summary"],
            "results": results
        })

    except Exception as e:
        logger.error(f"Reverse shell scan error: {str(e)}")
        return jsonify({"error": f"Scan failed: {str(e)}"}), 500

@bp.route('/api/reverse-shell/scan/<scan_id>', methods=['GET'])
def get_reverse_shell_results(scan_id: str):
    """Get results for a specific reverse shell scan"""
    if scan_id in detection_results:
        return jsonify(detection_results[scan_id])
    else:
        return jsonify({"error": "Scan not found"}), 404

@bp.route('/api/reverse-shell/current-scan', methods=['GET'])
def get_current_reverse_shell_scan():
    """Get the most recent reverse shell scan results"""
    if current_detection and current_detection in detection_results:
        return jsonify(detection_results[current_detection])
    else:
        return jsonify({"error": "No recent scan found"}), 404

@bp.route('/api/reverse-shell/history', methods=['GET'])
def get_reverse_shell_history():
    """Get history of all reverse shell scans"""
    return jsonify({
        "scans": list(detection_results.values()),
        "total_scans": len(detection_results)
    })

@bp.route('/api/reverse-shell/health', methods=['GET'])
def reverse_shell_health():
    return jsonify({"message": "Reverse Shell Detector API is running", "status": "active"})
