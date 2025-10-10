from flask import Blueprint, request, jsonify
import subprocess
import re
import json
from typing import List, Dict
import logging
from datetime import datetime

bp = Blueprint('portscanner', __name__)

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
                    ports_data.append(port_info)
    
    return ports_data

@bp.route('/api/scan', methods=['POST'])
def start_scan():
    """Start a port scan with given configuration"""
    global current_scan
    
    try:
        scan_config = request.get_json()
        if not scan_config:
            return jsonify({"error": "No JSON data provided"}), 400
        
        target = scan_config.get("target", "").strip()
        scan_type = scan_config.get("scanType", "quick")
        service_detection = scan_config.get("serviceDetection", False)
        os_detection = scan_config.get("osDetection", False)
        
        if not target:
            return jsonify({"error": "Target IP or range is required"}), 400
        
        logger.info(f"Starting {scan_type} scan for target: {target}")
        
        # Execute scan based on type
        if scan_type == "quick":
            results = nmap_quick_scan(target)
        elif scan_type == "full":
            results = nmap_full_scan(target)
        elif scan_type == "detailed":
            results = nmap_detailed_scan(target, service_detection, os_detection)
        else:
            return jsonify({"error": "Invalid scan type"}), 400
        
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
        
        return jsonify({
            "scan_id": scan_id,
            "target": target,
            "scan_type": scan_type,
            "results": results,
            "total_ports_found": len(results)
        })
        
    except Exception as e:
        logger.error(f"Scan error: {str(e)}")
        return jsonify({"error": f"Scan failed: {str(e)}"}), 500

@bp.route('/api/scan/<scan_id>', methods=['GET'])
def get_scan_results(scan_id: str):
    """Get results for a specific scan"""
    if scan_id in scan_results:
        return jsonify(scan_results[scan_id])
    else:
        return jsonify({"error": "Scan not found"}), 404

@bp.route('/api/current-scan', methods=['GET'])
def get_current_scan():
    """Get the most recent scan results"""
    if current_scan and current_scan in scan_results:
        return jsonify(scan_results[current_scan])
    else:
        return jsonify({"error": "No recent scan found"}), 404

@bp.route('/api/scan-history', methods=['GET'])
def get_scan_history():
    """Get history of all scans"""
    return jsonify({
        "scans": list(scan_results.values()),
        "total_scans": len(scan_results)
    })

@bp.route('/api/health', methods=['GET'])
def health():
    return jsonify({"message": "Port Scanner API is running", "status": "active"})
