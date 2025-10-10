import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Shield, Cpu, Map, Settings, HelpCircle, Bell, Printer, Terminal, Moon, Sun, Wifi, Play, Filter, Download, RefreshCw, Upload } from "lucide-react";
//import logo from "/public/logos/shellsweep-faviconresized.png";

function Sidebar() {
  const menuItems = [
    { name: "Dashboard", icon: <Home size={18} />, path: "/" },
    { name: "Port Scanner", icon: <Search size={18} />, path: "/port-scanner" },
    { name: "IoT Vulnerability Checker", icon: <Shield size={18} />, path: "/iot-vuln-checker" },
    { name: "ML IP Analyzer", icon: <Cpu size={18} />, path: "/ml-ip-analyzer" },
    { name: "Network Map", icon: <Map size={18} />, path: "/network-map" },
  ];

  return (
    <div className="bg-slate-900 text-white w-64 flex flex-col flex-shrink-0 h-full">
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
           
            ShellSweep
          </h1>
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-2 rounded-lg transition-colors duration-200 hover:bg-slate-800 ${
                    isActive ? "bg-blue-600" : ""
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-700 flex-shrink-0">
        <div className="flex flex-col gap-2">
          <NavLink to="/settings" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800">
            <Settings size={18} /> Settings
          </NavLink>
          <NavLink to="/help-support" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800">
            <HelpCircle size={18} /> Help & Support
          </NavLink>
        </div>
      </div>
    </div>
  );
}

function PageTitle() {
  const location = useLocation();
  
  const getTitle = () => {
    switch(location.pathname) {
      case '/': return 'Dashboard';
      case '/port-scanner': return 'Port Scanner';
      case '/iot-vuln-checker': return 'IoT Vulnerability Checker';
      case '/ml-ip-analyzer': return 'ML IP Analyzer';
      case '/network-map': return 'Network Map';
      default: return '';
    }
  };

  return (
    <h2 className="text-xl font-semibold mr-auto ml-4">
      {getTitle()}
    </h2>
  );
}

function TopBar({ invertColors, toggleInvertColors }: { invertColors: boolean, toggleInvertColors: () => void }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center bg-white p-4 shadow relative">
      <PageTitle />
      
      <div className="flex items-center gap-2">
        <button
          onClick={toggleInvertColors}
          className="p-2 hover:bg-gray-100 rounded-full"
          title={invertColors ? 'Disable color inversion' : 'Enable color inversion'}
        >
          {invertColors ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Bell size={20} />
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg border z-50">
              <div className="p-4 font-semibold border-b">Notifications</div>
              <div className="p-4 text-gray-500">No new notifications</div>
            </div>
          )}
        </div>

        <button
          onClick={() => window.print()}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Printer size={20} />
        </button>

        <button
          onClick={() => setShowHelp(true)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 relative">
            <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
              <li>Nullam scelerisque nunc sit amet lacus consequat.</li>
              <li>Vestibulum ante ipsum primis in faucibus orci luctus.</li>
              <li>Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.</li>
            </ul>
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsModal({ show, onClose }: { show: boolean, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('general');
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    }
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show]);

  const handleClose = () => {
    onClose();
    navigate(-1);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg w-1/2 min-w-[500px] max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="flex border-b">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 font-medium ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
          >
            General
          </button>
          <button 
            onClick={() => setActiveTab('about')}
            className={`px-6 py-3 font-medium ${activeTab === 'about' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
          >
            About
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-medium mb-3">Appearance</h1>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Theme</span>
                    <select className="border rounded px-3 py-1">
                      <option>Light</option>
                      <option>Dark</option>
                      <option>System</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Font Size</span>
                    <select className="border rounded px-3 py-1">
                      <option>Small</option>
                      <option>Medium</option>
                      <option>Large</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <h1 className="font-medium mb-3">Notifications</h1>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Email alerts</span>
                    <input type="checkbox" className="h-4 w-4" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sound notifications</span>
                    <input type="checkbox" className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'about' && (
            <div className="flex flex-col items-center text-center">
              <img
                src="/public/logos/shellsweep-dark.png"
                alt="ShellSweep"
                className="w-40 h-40 mb-4 drop-shadow-lg"
              />
              <p className="mb-4 text-gray-600 font-medium">"Hunting Threats where Firewalls can't Reach"</p>
              <p className="text-sm mb-4">Version 0.0.3 (beta)</p>
              <div className="mt-6 pt-4 border-t w-full">
                <p className="text-sm">Developed in 🇵🇰 with 💙 By</p>
                <p className="text-sm font-medium">Syed Ahmed Haroon, Hassan Javed, Faraz Hashmi, Daniyal Mirza</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t p-4 flex justify-end">
          <button 
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function VisualMap() {
  const [devices, setDevices] = useState<Array<{
    ip: string;
    hostname: string;
    type: string;
    status: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNetworkData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/');
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
    <div className="bg-white rounded-xl p-6 shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Network Map</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Scanning..." : "Refresh Scan"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="relative h-96 border rounded-lg bg-gray-50 flex items-center justify-center">
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
            {devices.length > 0 && (
              <>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className={`w-16 h-16 ${getDeviceColor('router')} rounded-full flex flex-col items-center justify-center text-white`}>
                    <Wifi size={24} />
                    <span className="text-xs mt-1">Router</span>
                  </div>
                </div>
                
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
      
      {!loading && devices.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Found {devices.length} device{devices.length !== 1 ? 's' : ''} on network
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-medium mb-2">Device Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm mb-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>Router</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span>Computer</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>IoT</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
            <span>Mobile</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
            <span>Unknown</span>
          </div>
        </div>
        
        <h3 className="font-medium mb-2">Status Indicators</h3>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Active</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Warning</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortScanner() {
  const [scanConfig, setScanConfig] = useState({
    target: "192.168.1.0/24",
    scanType: "quick",
    timing: "t3",
    serviceDetection: true,
    osDetection: false
  });

  const [openPorts, setOpenPorts] = useState([
    {
      ip: "192.168.1.10",
      port: 80,
      protocol: "TCP",
      service: "HTTP",
      state: "Open",
      version: "Apache/2.4.41"
    },
    {
      ip: "192.168.1.10",
      port: 443,
      protocol: "TCP",
      service: "HTTPS",
      state: "Open",
      version: "Apache/2.4.41"
    },
    {
      ip: "192.168.1.15",
      port: 22,
      protocol: "TCP",
      service: "SSH",
      state: "Open",
      version: "OpenSSH 8.2"
    },
    {
      ip: "192.168.1.20",
      port: 21,
      protocol: "TCP",
      service: "FTP",
      state: "Closed",
      version: "ProFTPD"
    }
  ]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setScanConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleStartScan = () => {
    console.log("Starting scan with config:", scanConfig);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white shadow rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Port Scan Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target IP or Range
            </label>
            <input
              type="text"
              value={scanConfig.target}
              onChange={(e) => handleInputChange("target", e.target.value)}
              placeholder="192.168.1.0/24"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scan Type
            </label>
            <select
              value={scanConfig.scanType}
              onChange={(e) => handleInputChange("scanType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="quick">Quick Scan (Top 100 ports)</option>
              <option value="full">Full Scan (All ports)</option>
              <option value="custom">Custom Port Range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timing Template
            </label>
            <select
              value={scanConfig.timing}
              onChange={(e) => handleInputChange("timing", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={scanConfig.serviceDetection}
                onChange={(e) => handleInputChange("serviceDetection", e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Service Detection</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={scanConfig.osDetection}
                onChange={(e) => handleInputChange("osDetection", e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">OS Detection</span>
            </label>
          </div>

          <button
            onClick={handleStartScan}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Play size={16} />
            Start Scan
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Open Ports</h2>
          <div className="flex gap-2">
            <button className="border border-gray-300 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-100 text-sm flex items-center gap-1">
              <Filter size={14} />
              Filter
            </button>
            <button className="border border-gray-300 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-100 text-sm flex items-center gap-1">
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Port
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Protocol
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {openPorts.map((port, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {port.ip}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {port.port}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {port.protocol}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {port.service}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      port.state === "Open" 
                        ? "bg-green-100 text-green-600" 
                        : "bg-red-100 text-red-600"
                    }`}>
                      {port.state}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {port.version}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button className="text-blue-600 hover:text-blue-800">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Network Scan Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <p className="text-gray-500">Network scan in progress: 75% complete</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{width: '75%'}}></div>
            </div>
          </div>
          <div>
            <p className="text-gray-500">Scan Type</p>
            <p className="font-medium">Full Network Scan</p>
          </div>
          <div>
            <p className="text-gray-500">Started</p>
            <p className="font-medium">April 17, 2025 15:20</p>
          </div>
          <div>
            <p className="text-gray-500">ETA</p>
            <p className="font-medium">10 minutes remaining</p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-500">IP Range:</p>
            <p className="font-medium">192.168.1.0/24</p>
          </div>
          <div>
            <p className="text-gray-500">Device1:</p>
            <p className="font-medium">27 detected</p>
          </div>
          <div>
            <p className="text-gray-500">Scan Mode:</p>
            <p className="font-medium">Aggressive</p>
          </div>
          <div>
            <p className="text-gray-500">Ports:</p>
            <p className="font-medium">All common</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow text-center">
          <p className="text-gray-500">Gbps Scan</p>
          <p className="text-3xl font-bold">9'00</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow text-center">
          <p className="text-gray-500">Open Ports</p>
          <p className="text-3xl font-bold">4</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow text-center">
          <p className="text-gray-500">Detected Threads</p>
          <p className="text-3xl font-bold text-red-500">3</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow text-center">
          <p className="text-gray-500">Reset</p>
          <p className="text-3xl font-bold text-orange-500">2 require immediate action</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-gray-600">Devices Detected</h3>
              <p className="text-3xl font-bold">12</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-gray-600">Vulnerabilities Found</h3>
              <p className="text-3xl font-bold text-red-500">4</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-gray-600">Reverse Shells</h3>
              <p className="text-3xl font-bold text-orange-500">1</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-gray-600">Last Scan</h3>
              <p className="text-lg font-medium">2025-08-10</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="border-b pb-4">
              <p className="font-medium">Port scan completed</p>
              <p className="text-gray-500 text-sm">Full scan on 192.168.1.15 completed, 3 open ports found.</p>
            </div>
            <div className="border-b pb-4">
              <p className="font-medium text-red-500">Critical vulnerability detected</p>
              <p className="text-gray-500 text-sm">CVE-2025-1234 found on IP Camera (192.168.1.23).</p>
            </div>
            <div className="border-b pb-4">
              <p className="font-medium">New device connected</p>
              <p className="text-gray-500 text-sm">Device "Phone-Adam" (192.168.1.27) joined the network.</p>
            </div>
            <div className="border-b pb-4">
              <p className="font-medium">ML analysis completed</p>
              <p className="text-gray-500 text-sm">3 suspicious IPs identified with 93% confidence.</p>
            </div>
          </div>
          <button className="mt-4 text-blue-600 hover:text-blue-800">View All</button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Network Overview</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-gray-500">Successful</p>
              <p className="text-3xl font-bold">7</p>
              <p className="text-sm text-gray-500">3 IP addresses flagged</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-gray-500">ML Predictions</p>
              <p className="text-3xl font-bold">8</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-gray-500">Connected Devices</p>
              <p className="text-3xl font-bold">27</p>
              <p className="text-sm text-gray-500">3 IoT devices identified</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-gray-500">Total Alerts</p>
              <p className="text-3xl font-bold">9</p>
            </div>
          </div>
          
          <h4 className="font-medium mb-2">Threat Summary</h4>
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <p className="text-sm">Critical Vulnerability: Outdated firmware on IP Camera (192.168.1.22) allows remote code execution.</p>
            </div>
            <div className="flex items-start">
              <span className="text-orange-500 mr-2">•</span>
              <p className="text-sm">Suspicious Activity: Unusual outbound traffic from 192.168.1.15 to known C2 server.</p>
            </div>
            <div className="flex items-start">
              <span className="text-yellow-500 mr-2">•</span>
              <p className="text-sm">Weak Credentials: Default password detected on router admin interface (192.168.1.1).</p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <p className="text-sm">Open Ports: Multiple unnecessary ports open on NAS device (192.168.1.10).</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Network Traffic</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded">Daily</button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded">Weekly</button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded">Monthly</button>
          </div>
        </div>
        
        <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center text-gray-400">
          Network traffic visualization would appear here
        </div>
        
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <p className="text-gray-500">Total Traffic</p>
            <p className="font-medium">2.7 TB</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Blocked Attempts</p>
            <p className="font-medium">437</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Avg. Response Time</p>
            <p className="font-medium">42 ms</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Uptime</p>
            <p className="font-medium">98.97%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NetworkMapPage() {
  return (
    <div className="p-6">
      <VisualMap />
    </div>
  );
}

function IoTVulnerabilityChecker() {
  const [deviceConfig, setDeviceConfig] = useState({
    deviceType: "IP Camera",
    firmwareVersion: "",
    targetIP: "192.168.1.100"
  });

  const [firmwareFile, setFirmwareFile] = useState<File | null>(null);
  const [customPayload, setCustomPayload] = useState("");
  const [payloadType, setPayloadType] = useState("buffer-overflow");
  const [scanLoading, setScanLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const vulnerabilities = [
    {
      type: "Outdated Firmware",
      severity: "High",
      description: "Firmware version is 3 years old with known CVEs",
      status: "Vulnerable",
    },
    {
      type: "Hardcoded Credentials",
      severity: "Critical",
      description: "Default admin credentials found in firmware",
      status: "Vulnerable",
    },
    {
      type: "Exposed API",
      severity: "Medium",
      description: "Unsecured API endpoint detected",
      status: "Fixed",
    }
  ];

  const handleDeviceConfigChange = (field: string, value: string) => {
    setDeviceConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFirmwareFile(file);
    }
  };

  const handleBasicScan = async () => {
    setScanLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setScanLoading(false);
    alert("Basic scan completed!");
  };

  const handleCustomPayloadTest = async () => {
    setTestLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTestLoading(false);
    alert("Custom payload test completed!");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'vulnerable': return 'bg-red-100 text-red-800';
      case 'fixed': return 'bg-green-100 text-green-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">IoT Vulnerability Checker</h1>
        <p className="text-gray-600">Comprehensive security analysis for IoT devices and firmware</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Scan Card */}
          <div className="bg-white rounded-xl p-6 shadow">
            <h2 className="text-lg font-semibold mb-4">Basic Scan</h2>
            <p className="text-gray-600 mb-4">
              Comprehensive analysis of common IoT vulnerabilities
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-sm text-gray-700">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Firmware Image Age Check
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Hardcoded Credentials Detection
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Exposed API Analysis
              </li>
            </ul>
            <button
              onClick={handleBasicScan}
              disabled={scanLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {scanLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Scanning...
                </>
              ) : (
                'Start Basic Scan'
              )}
            </button>
          </div>

          {/* Custom Payload Testing Card */}
          <div className="bg-white rounded-xl p-6 shadow">
            <h2 className="text-lg font-semibold mb-4">Custom Payload Testing</h2>
            <p className="text-gray-600 mb-4">
              Test specific vulnerabilities with custom payloads
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payload Type
              </label>
              <select
                value={payloadType}
                onChange={(e) => setPayloadType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="buffer-overflow">Buffer Overflow</option>
                <option value="sql-injection">SQL Injection</option>
                <option value="command-injection">Command Injection</option>
                <option value="xss">Cross-Site Scripting (XSS)</option>
                <option value="path-traversal">Path Traversal</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Payload
              </label>
              <textarea
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                placeholder="Enter your custom payload..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <button
              onClick={handleCustomPayloadTest}
              disabled={testLoading || !customPayload.trim()}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {testLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Custom Payload'
              )}
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Device Configuration Card */}
          <div className="bg-white rounded-xl p-6 shadow">
            <h2 className="text-lg font-semibold mb-4">Device Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Type
                </label>
                <select
                  value={deviceConfig.deviceType}
                  onChange={(e) => handleDeviceConfigChange('deviceType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>IP Camera</option>
                  <option>Smart Router</option>
                  <option>IoT Sensor</option>
                  <option>Smart Home Hub</option>
                  <option>Network Switch</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firmware Version
                </label>
                <input
                  type="text"
                  value={deviceConfig.firmwareVersion}
                  onChange={(e) => handleDeviceConfigChange('firmwareVersion', e.target.value)}
                  placeholder="e.g., v2.1.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target IP
                </label>
                <input
                  type="text"
                  value={deviceConfig.targetIP}
                  onChange={(e) => handleDeviceConfigChange('targetIP', e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Firmware Upload
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="firmware-upload"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".bin,.img,.hex,.fw"
                />
                <label htmlFor="firmware-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <Upload size={24} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      Drag and drop firmware file or click to upload
                    </p>
                    <p className="text-xs text-gray-500">Supported formats: .bin, .img, .hex, .fw</p>
                    {firmwareFile && (
                      <p className="text-sm text-green-600 mt-2">
                        Selected: {firmwareFile.name}
                      </p>
                    )}
                  </div>
                </label>
              </div>
              <button
                onClick={() => document.getElementById('firmware-upload')?.click()}
                className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-colors"
              >
                Browse Files
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vulnerability Report Card */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">Vulnerability Report</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VULNERABILITY TYPE
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SEVERITY
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DESCRIPTION
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vulnerabilities.map((vuln, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {vuln.type}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(vuln.severity)}`}>
                      {vuln.severity}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {vuln.description}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vuln.status)}`}>
                      {vuln.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-800 font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {vulnerabilities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No vulnerabilities detected. Run a scan to check for security issues.
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6">
      <p className="text-gray-500">This is a placeholder for the {title} page.</p>
    </div>
  );
}

function SettingsPage({ onModalOpen }: { onModalOpen: () => void }) {
  useEffect(() => {
    onModalOpen();
  }, [onModalOpen]);

  return null;
}

function HelpSupportPage() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Help & Support</h2>
      <div className="bg-white rounded-xl p-6 shadow">
        <h3 className="font-medium mb-2">Contact Support</h3>
        <p className="text-gray-600 mb-4">Email: support@shellsweep.com</p>
        <p className="text-gray-600">Phone: +92 300 1234567</p>
      </div>
    </div>
  );
}

export default function App() {
  const [invertColors, setInvertColors] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const toggleInvertColors = () => {
    setInvertColors(!invertColors);
  };

  useEffect(() => {
    if (invertColors) {
      document.documentElement.style.filter = "invert(1) hue-rotate(178deg)";
    } else {
      document.documentElement.style.filter = "none";
    }
  }, [invertColors]);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <TopBar invertColors={invertColors} toggleInvertColors={toggleInvertColors} />
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/port-scanner" element={<PortScanner />} />
              <Route path="/iot-vuln-checker" element={<IoTVulnerabilityChecker />} />
              <Route path="/ml-ip-analyzer" element={<PlaceholderPage title="ML IP Analyzer" />} />
              <Route path="/network-map" element={<NetworkMapPage />} />
              <Route 
                path="/settings" 
                element={<SettingsPage onModalOpen={() => setShowSettingsModal(true)} />} 
              />
              <Route path="/help-support" element={<HelpSupportPage />} />
            </Routes>
          </div>
        </div>
      </div>
      
      <SettingsModal show={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </Router>
  );
}