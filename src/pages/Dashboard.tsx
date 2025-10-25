import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";

// TypeScript interfaces
interface Device {
  ip: string;
  hostname: string;
  type: 'router' | 'computer' | 'iot' | 'mobile' | 'unknown';
  status: 'active' | 'warning' | 'danger' | 'inactive';
  mac?: string;
  vendor?: string;
}

interface Port {
  ip: string;
  port: number;
  protocol: string;
  service: string;
  state: string;
  version: string;
  threat?: boolean;
  threat_description?: string;
  recommended_action?: string;
}

interface ReverseShellFinding {
  type: string;
  local_address?: string;
  remote_address?: string;
  port?: number;
  description: string;
  process?: any;
  risk_level: string;
  timestamp: string;
  pid?: number;
  name?: string;
  cmdline?: string[];
  username?: string;
}

function Dashboard() {
  const [currentScan, setCurrentScan] = useState<any>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [reverseShellScan, setReverseShellScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch current scan results
      const scanResponse = await fetch('/api/current-scan');
      if (scanResponse.ok) {
        const scanData = await scanResponse.json();
        setCurrentScan(scanData);
      }

      // Fetch devices
      const devicesResponse = await fetch('/api/devices');
      if (devicesResponse.ok) {
        const devicesData = await devicesResponse.json();
        setDevices(devicesData.devices || []);
      }

      // Fetch reverse shell scan results
      const reverseShellResponse = await fetch('/api/reverse-shell/current-scan');
      if (reverseShellResponse.ok) {
        const reverseShellData = await reverseShellResponse.json();
        setReverseShellScan(reverseShellData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for scan completion events to refresh dashboard
  useEffect(() => {
    const handleScanCompleted = () => {
      fetchData();
    };

    window.addEventListener('scanCompleted', handleScanCompleted);

    return () => {
      window.removeEventListener('scanCompleted', handleScanCompleted);
    };
  }, [fetchData]);

  const openPortsCount = currentScan?.results?.length || 0;
  const devicesCount = devices.length;
  const lastScanDate = currentScan?.timestamp ? new Date(currentScan.timestamp).toLocaleDateString() : 'No scan yet';
  const reverseShellFindings = reverseShellScan ? [...(reverseShellScan.connections || []), ...(reverseShellScan.processes || [])] : [];
  const highRiskFindings = reverseShellFindings.filter((f: ReverseShellFinding) => f.risk_level === 'high');
  const lastReverseShellScanDate = reverseShellScan?.timestamp ? new Date(reverseShellScan.timestamp).toLocaleDateString() : 'No scan yet';

  return (
    <div className="p-6 space-y-6">
      {/* Network Scan Status Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Network Scan Status</h3>
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <p className="text-gray-500 dark:text-gray-400">Latest scan: {currentScan ? 'Completed' : 'No scan performed'}</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{width: currentScan ? '100%' : '0%'}}></div>
            </div>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Scan Type</p>
            <p className="font-medium text-gray-900 dark:text-white">{currentScan?.scan_type || 'None'}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Target</p>
            <p className="font-medium text-gray-900 dark:text-white">{currentScan?.target || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Last Scan</p>
            <p className="font-medium text-gray-900 dark:text-white">{lastScanDate}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Devices Found:</p>
            <p className="font-medium text-gray-900 dark:text-white">{devicesCount}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Open Ports:</p>
            <p className="font-medium text-gray-900 dark:text-white">{openPortsCount}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Scan Mode:</p>
            <p className="font-medium text-gray-900 dark:text-white">{currentScan?.scan_type || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Service Detection:</p>
            <p className="font-medium text-gray-900 dark:text-white">{currentScan?.service_detection ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow text-center">
          <p className="text-gray-500 dark:text-gray-400">Devices Detected</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{devicesCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow text-center">
          <p className="text-gray-500 dark:text-gray-400">Open Ports</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{openPortsCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow text-center">
          <p className="text-gray-500 dark:text-gray-400">Filtered Ports</p>
          <p className="text-3xl font-bold text-orange-500">
            {currentScan?.results?.filter((port: Port) => port.state === 'Filtered').length || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow text-center">
          <p className="text-gray-500 dark:text-gray-400">Closed Ports</p>
          <p className="text-3xl font-bold text-gray-500 dark:text-gray-400">
            {currentScan?.results?.filter((port: Port) => port.state === 'Closed').length || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow text-center">
          <p className="text-gray-500 dark:text-gray-400">Reverse Shell Findings</p>
          <p className="text-3xl font-bold text-red-500">{reverseShellFindings.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{highRiskFindings.length} high risk</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h3>

          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="text-gray-600 dark:text-gray-300">Devices Detected</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{devicesCount}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="text-gray-600 dark:text-gray-300">Open Ports Found</h3>
              <p className="text-3xl font-bold text-blue-500">{openPortsCount}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="text-gray-600 dark:text-gray-300">Filtered Ports</h3>
              <p className="text-3xl font-bold text-orange-500">
                {currentScan?.results?.filter((port: Port) => port.state === 'Filtered').length || 0}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="text-gray-600 dark:text-gray-300">Reverse Shell Findings</h3>
              <p className="text-3xl font-bold text-red-500">{reverseShellFindings.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{highRiskFindings.length} high risk</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="text-gray-600 dark:text-gray-300">Last Scan</h3>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{lastScanDate}</p>
            </div>
          </div>

          <div className="space-y-4">
            {currentScan ? (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="font-medium text-gray-900 dark:text-white">Port scan completed</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {currentScan.scan_type} scan on {currentScan.target} completed, {openPortsCount} open ports found.
                </p>
              </div>
            ) : (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="font-medium text-gray-900 dark:text-white">No recent scans</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Perform a port scan to see results here.</p>
              </div>
            )}
            {reverseShellScan ? (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="font-medium text-gray-900 dark:text-white">Reverse shell detection completed</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Scan on {reverseShellScan.target} completed, {reverseShellFindings.length} findings detected ({highRiskFindings.length} high risk).
                </p>
              </div>
            ) : (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="font-medium text-gray-900 dark:text-white">No reverse shell scans</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Perform a reverse shell detection scan to see results here.</p>
              </div>
            )}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <p className="font-medium text-gray-900 dark:text-white">Network scan completed</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{devicesCount} devices detected on the network.</p>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <p className="font-medium text-gray-900 dark:text-white">Device types identified</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {devices.filter(d => d.type === 'computer').length} computers, {devices.filter(d => d.type === 'iot').length} IoT devices, {devices.filter(d => d.type === 'mobile').length} mobile devices.
              </p>
            </div>
          </div>
          <button className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">View All</button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Network Overview</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-gray-500 dark:text-gray-400">Active Devices</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{devices.filter(d => d.status === 'active').length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{devices.filter(d => d.status !== 'active').length} inactive</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-gray-500 dark:text-gray-400">Total Ports Scanned</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{currentScan?.results?.length || 0}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-gray-500 dark:text-gray-400">Reverse Shell Findings</p>
              <p className="text-3xl font-bold text-red-500">{reverseShellFindings.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{highRiskFindings.length} high risk</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-gray-500 dark:text-gray-400">Connected Devices</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{devicesCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{devices.filter(d => d.type === 'iot').length} IoT devices</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-gray-500 dark:text-gray-400">Unique IPs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{new Set(devices.map(d => d.ip)).size}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-gray-500 dark:text-gray-400">Last Reverse Shell Scan</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{lastReverseShellScanDate}</p>
            </div>
          </div>

          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Port Summary</h4>
          <div className="space-y-3">
            {currentScan?.results?.slice(0, 4).map((port: Port, index: number) => (
              <div key={index} className="flex items-start">
                <span className={`mr-2 ${port.state === 'Open' ? 'text-green-500' : port.state === 'Filtered' ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>•</span>
                <p className="text-sm text-gray-900 dark:text-white">Port {port.port} ({port.protocol}) - {port.service} - {port.state}</p>
              </div>
            )) || (
              <div className="flex items-start">
                <span className="text-gray-500 dark:text-gray-400 mr-2">•</span>
                <p className="text-sm text-gray-900 dark:text-white">No port scan results available</p>
              </div>
            )}
          </div>

          <h4 className="font-medium mb-2 mt-6 text-gray-900 dark:text-white">Reverse Shell Findings</h4>
          <div className="space-y-3">
            {highRiskFindings.slice(0, 3).map((finding: ReverseShellFinding, index: number) => (
              <div key={index} className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <p className="text-sm text-gray-900 dark:text-white">{finding.description} ({finding.type})</p>
              </div>
            )) || (
              <div className="flex items-start">
                <span className="text-gray-500 dark:text-gray-400 mr-2">•</span>
                <p className="text-sm text-gray-900 dark:text-white">No high-risk reverse shell findings</p>
              </div>
            )}
            {reverseShellFindings.length > 0 && (
              <div className="flex items-start">
                <span className="text-gray-500 dark:text-gray-400 mr-2">•</span>
                <p className="text-sm text-gray-900 dark:text-white">Total findings: {reverseShellFindings.length} ({reverseShellScan?.risk_summary?.high || 0} high, {reverseShellScan?.risk_summary?.medium || 0} medium, {reverseShellScan?.risk_summary?.low || 0} low)</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Network Devices</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded">All</button>
            <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">Active</button>
            <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">Inactive</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hostname</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendor</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {devices.slice(0, 5).map((device, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{device.ip}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{device.hostname}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white capitalize">{device.type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      device.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' :
                      device.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400' :
                      device.status === 'danger' ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {device.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{device.vendor || 'Unknown'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Total Devices</p>
            <p className="font-medium text-gray-900 dark:text-white">{devicesCount}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Active</p>
            <p className="font-medium text-gray-900 dark:text-white">{devices.filter(d => d.status === 'active').length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Warning</p>
            <p className="font-medium text-gray-900 dark:text-white">{devices.filter(d => d.status === 'warning').length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Danger</p>
            <p className="font-medium text-gray-900 dark:text-white">{devices.filter(d => d.status === 'danger').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
