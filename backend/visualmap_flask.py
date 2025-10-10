from flask import Blueprint, jsonify
import subprocess
import re
import logging
from datetime import datetime, timedelta

bp = Blueprint('visualmap', __name__)

# Setup logging
logging.basicConfig(level=logging.INFO)
last_scan = None
cached_devices = []

def scan_network():
    try:
        # Use nmap for network discovery (works on Windows)
        result = subprocess.run(
            ["C:\\Program Files (x86)\\Nmap\\nmap.exe", "-sn", "192.168.100.0/24"],
            capture_output=True,
            text=True,
            timeout=300,
            check=True
        )
        logging.info("Scan completed successfully")
        logging.debug(f"Raw nmap output:\n{result.stdout}")
        return parse_nmap_output(result.stdout)
    except subprocess.TimeoutExpired:
        logging.error("Scan timed out")
        return {"error": "Scan timed out"}
    except Exception as e:
        logging.error(f"Scan failed: {e}")
        return {"error": str(e)}

def parse_arp_scan_output(output: str):
    """
    Parse the output of arp-scan command.
    Expected output lines:
    IP address       MAC address         Vendor
    192.168.1.1      00:11:22:33:44:55  Cisco Systems
    """
    devices = []
    for line in output.splitlines():
        line = line.strip()
        # Skip header and empty lines
        if not line or line.startswith("Interface:") or line.startswith("Starting") or line.startswith("Ending") or line.startswith("packets"):
            continue
        parts = line.split()
        if len(parts) >= 2:
            ip = parts[0]
            mac = parts[1]
            vendor = " ".join(parts[2:]) if len(parts) > 2 else None
            # Validate MAC address format
            if re.match(r"([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}", mac):
                device = {
                    "ip": ip,
                    "hostname": f"Unknown-{ip}",
                    "type": "unknown",
                    "status": "active",
                    "mac": mac,
                    "vendor": vendor or "Unknown Vendor"
                }
                classify_device_by_vendor(device)
                classify_device_type(device)
                devices.append(device)
    # Filter out network and broadcast IPs
    filtered_devices = []
    for device in devices:
        ip_last_octet = int(device["ip"].split(".")[-1])
        if ip_last_octet != 0 and ip_last_octet != 255:
            filtered_devices.append(device)

    logging.info(f"Parsed {len(devices)} devices from arp-scan output, filtered to {len(filtered_devices)}")
    return filtered_devices

def parse_nmap_output(output: str):
    devices = []
    current_device = None
    
    # Improved patterns
    ip_pattern = r"Nmap scan report for (?:([\w\.-]+) )?\(?(\d+\.\d+\.\d+\.\d+)\)?"
    mac_pattern = r"MAC Address: ([0-9A-F:]{17})(?: \((.+)\))?"
    host_state_pattern = r"Host is (up|down)"
    dns_pattern = r"(\d+\.\d+\.\d+\.\d+)\.in-addr\.arpa"

    for line in output.splitlines():
        line = line.strip()
        
        # Look for device entry start
        ip_match = re.match(ip_pattern, line)
        if ip_match:
            # Save previous device if exists
            if current_device:
                classify_device_type(current_device)
                devices.append(current_device)
            
            hostname, ip = ip_match.groups()
            current_device = {
                "ip": ip,
                "hostname": hostname or f"Unknown-{ip}",
                "type": "unknown",
                "status": "unknown",  # Will be determined later
                "mac": None,
                "vendor": None
            }
            continue
        
        # Look for MAC address and vendor
        mac_match = re.search(mac_pattern, line)
        if mac_match and current_device:
            mac, vendor = mac_match.groups()
            current_device["mac"] = mac
            current_device["vendor"] = vendor or "Unknown Vendor"
            # Use vendor info for initial classification
            classify_device_by_vendor(current_device)
            continue
        
        # Look for host status
        state_match = re.search(host_state_pattern, line)
        if state_match and current_device:
            state = state_match.group(1)
            current_device["status"] = "active" if state == "up" else "inactive"
            continue
        
        # Look for reverse DNS entries (better hostname detection)
        dns_match = re.search(dns_pattern, line)
        if dns_match and current_device and current_device["hostname"].startswith("Unknown-"):
            # If we have reverse DNS info but no hostname, try to extract
            if "PTR" in line and "in-addr.arpa" in line:
                # Extract hostname from PTR record
                ptr_match = re.search(r"PTR\s+([\w\.-]+)\.?", line)
                if ptr_match:
                    current_device["hostname"] = ptr_match.group(1)
    
    # Don't forget the last device
    if current_device:
        classify_device_type(current_device)
        devices.append(current_device)

    # Filter out devices without MAC addresses and exclude network/broadcast IPs
    filtered_devices = []
    for device in devices:
        ip_last_octet = int(device["ip"].split(".")[-1])
        if device["mac"] is not None and ip_last_octet != 0 and ip_last_octet != 255:
            filtered_devices.append(device)

    logging.info(f"Found {len(devices)} devices, filtered to {len(filtered_devices)} with MAC addresses")
    return filtered_devices

def classify_device_by_vendor(device):
    """Classify device based on vendor information from MAC address"""
    if not device.get("vendor") or device["vendor"] == "Unknown Vendor":
        return
    
    vendor_lower = device["vendor"].lower()
    
    # Router/Gateway vendors
    router_keywords = ['cisco', 'netgear', 'tp-link', 'd-link', 'tplink', 'linksys', 
                      'asus', 'buffalo', 'belkin', 'zyxel', 'ubiquiti', 'mikrotik']
    # Computer vendors
    computer_keywords = ['dell', 'hp', 'hewlett', 'lenovo', 'microsoft', 'intel', 
                        'asus', 'acer', 'toshiba', 'samsung', 'apple', 'ibm']
    # Mobile device vendors
    mobile_keywords = ['apple', 'samsung', 'xiaomi', 'huawei', 'oneplus', 'oppo', 
                      'vivo', 'motorola', 'lg', 'sony', 'nokia', 'google']
    # IoT/Smart device vendors
    iot_keywords = ['raspberry', 'arduino', 'philips', 'nest', 'ring', 'amazon', 
                   'google', 'roku', 'fire', 'echo', 'smart', 'camera']
    
    if any(keyword in vendor_lower for keyword in router_keywords):
        device["type"] = "router"
    elif any(keyword in vendor_lower for keyword in mobile_keywords):
        device["type"] = "mobile"
    elif any(keyword in vendor_lower for keyword in iot_keywords):
        device["type"] = "iot"
    elif any(keyword in vendor_lower for keyword in computer_keywords):
        device["type"] = "computer"

def classify_device_type(device):
    """Final classification using both hostname and vendor info"""
    # If still unknown, try hostname-based classification
    if device["type"] == "unknown":
        classify_device_by_hostname(device)
    
    # Ensure status is set
    if device["status"] == "unknown":
        device["status"] = "active"  # Default assumption
    
    # If hostname is still generic, try to improve it
    if device["hostname"].startswith("Unknown-"):
        device["hostname"] = f"Device-{device['ip'].split('.')[-1]}"

def classify_device_by_hostname(device):
    """Classify device based on hostname patterns"""
    hostname_lower = device["hostname"].lower()
    
    router_patterns = ['router', 'gateway', 'modem', 'ap-', 'accesspoint', 'wifi']
    mobile_patterns = ['iphone', 'android', 'phone', 'mobile', 'samsung', 'pixel', 
                      'ipad', 'tablet', 'galaxy']
    iot_patterns = ['pi', 'raspberry', 'arduino', 'iot', 'camera', 'sensor', 
                   'tv', 'smart', 'roku', 'firetv', 'chromecast']
    computer_patterns = ['pc', 'laptop', 'desktop', 'workstation', 'macbook', 
                        'server', 'nas', 'computer']
    
    if any(pattern in hostname_lower for pattern in router_patterns):
        device["type"] = "router"
    elif any(pattern in hostname_lower for pattern in mobile_patterns):
        device["type"] = "mobile"
    elif any(pattern in hostname_lower for pattern in iot_patterns):
        device["type"] = "iot"
    elif any(pattern in hostname_lower for pattern in computer_patterns):
        device["type"] = "computer"

@bp.route('/api/devices', methods=['GET'])
def get_devices():
    global last_scan, cached_devices
    try:
        if not last_scan or datetime.now() - last_scan > timedelta(minutes=5):
            logging.info("Initiating new network scan...")
            scan_result = scan_network()
            if isinstance(scan_result, dict) and "error" in scan_result:
                return jsonify(scan_result), 500
            cached_devices = scan_result
            last_scan = datetime.now()
            logging.info(f"Scan completed. Found {len(cached_devices)} devices")
        else:
            logging.info("Returning cached devices")
        
        return jsonify({"devices": cached_devices})
    except Exception as e:
        logging.error(f"Unexpected error in get_devices: {e}")
        return jsonify({"error": str(e)}), 500

@bp.route('/debug-scan', methods=['GET'])
def debug_scan():
    """Debug endpoint to see raw nmap output"""
    try:
        result = subprocess.run(
            ["C:\\Program Files (x86)\\Nmap\\nmap.exe", "-sn", "-v", "192.168.100.9/24"],
            capture_output=True,
            text=True,
            timeout=300,
            check=True
        )
        return jsonify({
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/test-single', methods=['GET'])
def test_single():
    """Test with a single IP for better debugging"""
    try:
        result = subprocess.run(
            ["nmap", "-sn", "-v", "192.168.100.1"],  # Test with router IP
            capture_output=True,
            text=True,
            timeout=30,
            check=True
        )
        return jsonify({
            "raw_output": result.stdout,
            "parsed_devices": parse_nmap_output(result.stdout)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
