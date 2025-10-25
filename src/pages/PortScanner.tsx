import { useState } from "react";
import { Play, Filter, Download } from "lucide-react";

// TypeScript interfaces
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

function PortScanner() {
  const [scanConfig, setScanConfig] = useState({
    target: "192.168.1.0/24",
    scanType: "quick",
    timing: "t3",
    serviceDetection: true,
    osDetection: false
  });

  const [openPorts, setOpenPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Reverse shell detection state
  const [reverseShellFindings, setReverseShellFindings] = useState<ReverseShellFinding[]>([]);
  const [reverseShellLoading, setReverseShellLoading] = useState(false);
  const [reverseShellError, setReverseShellError] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<ReverseShellFinding | null>(null);
  const [showFindingDetailsModal, setShowFindingDetailsModal] = useState(false);

  const handleExportReport = async () => {
    alert("Export functionality is not yet implemented.");
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setScanConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleStartScan = async () => {
    setLoading(true);
    setError(null);
    // Reset reverse shell state when starting new scan
    setReverseShellFindings([]);
    setReverseShellError(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanConfig),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOpenPorts(data.results || []);
      console.log('Scan results:', data);

      // Always run reverse shell detection after port scan
      await runReverseShellDetection(scanConfig.target);

      // Trigger dashboard refresh after scan completes
      window.dispatchEvent(new CustomEvent('scanCompleted'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scan');
      console.error('Error starting scan:', err);
    } finally {
      setLoading(false);
    }
  };

  const runReverseShellDetection = async (target: string) => {
    setReverseShellLoading(true);
    setReverseShellError(null);
    try {
      const response = await fetch('/api/reverse-shell/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setReverseShellFindings([...(data.results.connections || []), ...(data.results.processes || []), ...(data.results.remote_findings || [])]);
      console.log('Reverse shell scan results:', data);
    } catch (err) {
      setReverseShellError(err instanceof Error ? err.message : 'Failed to run reverse shell detection');
      console.error('Error running reverse shell detection:', err);
    } finally {
      setReverseShellLoading(false);
    }
  };

  function DetailsModal({ show, onClose, port }: { show: boolean, onClose: () => void, port: Port | null }) {
    if (!show || !port) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-96 p-6 relative" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Port Details</h2>
          <div className="space-y-2 text-gray-900 dark:text-white">
            <p><strong>IP Address:</strong> {port.ip}</p>
            <p><strong>Port:</strong> {port.port}</p>
            <p><strong>Protocol:</strong> {port.protocol}</p>
            <p><strong>Service:</strong> {port.version}</p>
            <p><strong>State:</strong> {port.state}</p>
            {port.threat && (
              <>
                <p><strong>Threat:</strong> Yes</p>
                <p><strong>Description:</strong> {port.threat_description}</p>
                <p><strong>Recommended Action:</strong> {port.recommended_action}</p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✖
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
          Error: {error}
        </div>
      )}

      {/* Scan Configuration Card */}
      <div className="bg-white dark:bg-gray-900 shadow rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Reverse Shell & Open Ports Detection Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Target IP Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target IP or Range
            </label>
            <input
              type="text"
              value={scanConfig.target}
              onChange={(e) => handleInputChange("target", e.target.value)}
              placeholder="192.168.1.0/24"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Scan Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Scan Type
            </label>
            <select
              value={scanConfig.scanType}
              onChange={(e) => handleInputChange("scanType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="quick">Quick Scan (Top 100 ports)</option>
              <option value="full">Full Scan (All ports)</option>
              <option value="custom">Custom Port Range</option>
            </select>
          </div>

          {/* Timing Template Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Timing Template
            </label>
            <select
              value={scanConfig.timing}
              onChange={(e) => handleInputChange("timing", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="t1">Paranoid (T1)</option>
              <option value="t2">Sneaky (T2)</option>
              <option value="t3">Normal (T3)</option>
              <option value="t4">Aggressive (T4)</option>
              <option value="t5">Insane (T5)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Checkboxes */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={scanConfig.serviceDetection}
                onChange={(e) => handleInputChange("serviceDetection", e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Service Detection</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={scanConfig.osDetection}
                onChange={(e) => handleInputChange("osDetection", e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">OS Detection</span>
            </label>
          </div>

          {/* Start Scan Button */}
          <button
            onClick={handleStartScan}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Play size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Scanning..." : "Start Scan"}
          </button>
        </div>
      </div>

      {/* Open Ports Card */}
      <div className="bg-white dark:bg-gray-900 shadow rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Open Ports & Reverse Shell Findings</h2>
          <div className="flex gap-2">
            <button className="border border-gray-300 dark:border-gray-600 px-3 py-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm flex items-center gap-1">
              <Filter size={14} />
              Filter
            </button>
            <button
              onClick={handleExportReport}
              className="border border-gray-300 dark:border-gray-600 px-3 py-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm flex items-center gap-1"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Ports Table */}
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Port
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Protocol
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  State
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {openPorts.map((port, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {port.ip}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {port.port}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {port.protocol}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {port.version}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      port.state === "Open"
                        ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                    }`}>
                      {port.state}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => {
                        setSelectedPort(port);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DetailsModal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} port={selectedPort} />

      {/* Reverse Shell Detection Results */}
      <div className="bg-white dark:bg-gray-900 shadow rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reverse Shell Detection Results</h2>
          {reverseShellLoading && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
              <span className="text-sm">Detecting...</span>
            </div>
          )}
        </div>

        {/* Reverse Shell Error Message */}
        {reverseShellError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
            Error: {reverseShellError}
          </div>
        )}

        {/* Reverse Shell Findings Table */}
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {reverseShellFindings.map((finding, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {finding.type.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {finding.remote_address || finding.name || finding.description.split(' - ')[0]}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      finding.risk_level === "high"
                        ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                        : finding.risk_level === "medium"
                        ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400"
                        : "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                    }`}>
                      {finding.risk_level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => {
                        setSelectedFinding(finding);
                        setShowFindingDetailsModal(true);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reverseShellFindings.length === 0 && !reverseShellLoading && !reverseShellError && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p>No reverse shell indicators detected</p>
            <p className="text-sm">The target appears clean or no suspicious activity found</p>
          </div>
        )}
      </div>

      {/* Reverse Shell Finding Details Modal */}
      {showFindingDetailsModal && selectedFinding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowFindingDetailsModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-96 p-6 relative" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Finding Details</h2>
            <div className="space-y-2 text-gray-900 dark:text-white">
              <p><strong>Type:</strong> {selectedFinding.type}</p>
              {selectedFinding.local_address && <p><strong>Local Address:</strong> {selectedFinding.local_address}</p>}
              {selectedFinding.remote_address && <p><strong>Remote Address:</strong> {selectedFinding.remote_address}</p>}
              {selectedFinding.port && <p><strong>Port:</strong> {selectedFinding.port}</p>}
              <p><strong>Description:</strong> {selectedFinding.description}</p>
              <p><strong>Risk Level:</strong>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  selectedFinding.risk_level === 'high' ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' :
                  selectedFinding.risk_level === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400' :
                  'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                }`}>
                  {selectedFinding.risk_level.toUpperCase()}
                </span>
              </p>
              {selectedFinding.pid && <p><strong>PID:</strong> {selectedFinding.pid}</p>}
              {selectedFinding.name && <p><strong>Process Name:</strong> {selectedFinding.name}</p>}
              {selectedFinding.username && <p><strong>User:</strong> {selectedFinding.username}</p>}
              {selectedFinding.cmdline && selectedFinding.cmdline.length > 0 && (
                <div>
                  <strong>Command Line:</strong>
                  <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                    {selectedFinding.cmdline.join(' ')}
                  </pre>
                </div>
              )}
              <p><strong>Timestamp:</strong> {new Date(selectedFinding.timestamp).toLocaleString()}</p>
            </div>
            <button
              onClick={() => setShowFindingDetailsModal(false)}
              className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortScanner;
