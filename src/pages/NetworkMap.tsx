import { useState, useEffect } from "react";
import { RefreshCw, Wifi } from "lucide-react";

// TypeScript interface for device data
interface Device {
  ip: string;
  hostname: string;
  type: 'router' | 'computer' | 'iot' | 'mobile' | 'unknown';
  status: 'active' | 'warning' | 'danger' | 'inactive';
  mac?: string;
  vendor?: string;
}

function NetworkMap() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch data from your Python backend
  const fetchNetworkData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/devices');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDevices(data.devices || []);
      console.log('Fetched devices:', data.devices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch network data');
      console.error('Error fetching network data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchNetworkData();
  }, []);

  const handleRefresh = () => {
    fetchNetworkData();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
      case 'inactive': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getDeviceColor = (type: string) => {
    switch(type) {
      case 'router': return 'bg-blue-500';
      case 'computer': return 'bg-purple-500';
      case 'iot': return 'bg-green-500';
      case 'mobile': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
      {/* Header with Title and Refresh Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Network Map</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Scanning..." : "Refresh Scan"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
          Error: {error}
        </div>
      )}

      {/* Network Visualization */}
      <div className="relative h-96 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <RefreshCw size={32} className="animate-spin text-blue-500" />
            <p className="text-gray-600">Scanning network...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center text-gray-500">
            <p>No devices found</p>
            <p className="text-sm">Make sure your Python server is running on localhost:8000</p>
          </div>
        ) : (
          <>
            {/* Find router or use first device as center */}
            {devices.length > 0 && (
              <>
                {/* Router/Center Device */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className={`w-16 h-16 ${getDeviceColor('router')} rounded-full flex flex-col items-center justify-center text-white`}>
                    <Wifi size={24} />
                    <span className="text-xs mt-1">Router</span>
                  </div>
                </div>

                {/* Connected Devices */}
                {devices.filter(d => d.type !== 'router').map((device, index) => {
                  const angle = (index * (360 / Math.max(devices.length - 1, 1))) * (Math.PI / 180);
                  const radius = 120;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <div
                      key={device.ip}
                      className={`absolute w-12 h-12 ${getDeviceColor(device.type)} rounded-full flex items-center justify-center text-white text-xs z-10`}
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      title={`${device.hostname}\n${device.ip}\nType: ${device.type}\nStatus: ${device.status}`}
                    >
                      {device.hostname.split('-')[0] || 'Device'}
                      <span className={`absolute -top-1 -right-1 w-3 h-3 ${getStatusColor(device.status)} rounded-full border-2 border-white`}></span>
                    </div>
                  );
                })}

                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                  {devices.filter(d => d.type !== 'router').map((device, index) => {
                    const angle = (index * (360 / Math.max(devices.length - 1, 1))) * (Math.PI / 180);
                    const x = Math.cos(angle) * 120;
                    const y = Math.sin(angle) * 120;

                    return (
                      <line
                        key={`line-${device.ip}`}
                        x1="50%"
                        y1="50%"
                        x2={`calc(50% + ${x}px)`}
                        y2={`calc(50% + ${y}px)`}
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeDasharray={device.status === 'inactive' ? '5,5' : '0'}
                      />
                    );
                  })}
                </svg>
              </>
            )}
          </>
        )}
      </div>

      {/* Device Count */}
      {!loading && devices.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Found {devices.length} device{devices.length !== 1 ? 's' : ''} on network
        </div>
      )}

      {/* Legends */}
      <div className="mt-6">
        <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Device Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm mb-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-900 dark:text-white">Router</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span className="text-gray-900 dark:text-white">Computer</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-900 dark:text-white">IoT</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
            <span className="text-gray-900 dark:text-white">Mobile</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
            <span className="text-gray-900 dark:text-white">Unknown</span>
          </div>
        </div>

        <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Status Indicators</h3>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-900 dark:text-white">Active</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-gray-900 dark:text-white">Warning</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-900 dark:text-white">Critical</span>
          </div>
        </div>
      </div>

      {/* Device Details Table */}
      <div className="mt-6">
        <h3 className="font-medium mb-4 text-gray-900 dark:text-white">Connected Devices</h3>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hostname
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  MAC Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vendor
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {devices.map((device, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {device.ip}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {device.hostname}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white capitalize">
                    {device.type}
                  </td>
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
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {device.mac || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {device.vendor || 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {devices.length === 0 && !loading && (
          <p className="text-gray-500 dark:text-gray-400 mt-4">No devices found.</p>
        )}
      </div>
    </div>
  );
}

export default NetworkMap;
