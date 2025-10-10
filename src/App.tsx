import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Shield, Cpu, Map, Settings, HelpCircle, Bell, Printer, Moon, Sun, Wifi, Play, Filter, Download, RefreshCw } from "lucide-react";
import logo from "/logos/shellsweep-faviconresized.png";


//#issue 1: Sidebar is scrolling with page content


// function Sidebar() {
//   const menuItems = [
//     { name: "Dashboard", icon: <Home size={18} />, path: "/" },
//     { name: "Port Scanner", icon: <Search size={18} />, path: "/port-scanner" },
//     { name: "IoT Vulnerability Checker", icon: <Shield size={18} />, path: "/iot-vuln-checker" },
//     { name: "ML IP Analyzer", icon: <Cpu size={18} />, path: "/ml-ip-analyzer" },
//     { name: "Network Map", icon: <Map size={18} />, path: "/network-map" },
//   ];

//   return (
//     <div className="bg-slate-900 text-white w-64 flex flex-col justify-between min-h-screen p-4">
//       <div>
//         <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
//           <img src={logo} alt="ShellSweep Logo" className="w-6 h-6" />
//           ShellSweep
//         </h1>
//         <nav className="flex flex-col gap-2">
//           {menuItems.map((item) => (
//             <NavLink
//               key={item.name}
//               to={item.path}
//               className={({ isActive }) =>
//                 `flex items-center gap-3 p-2 rounded-lg transition-colors duration-200 hover:bg-slate-800 ${
//                   isActive ? "bg-blue-600" : ""
//                 }`
//               }
//             >
//               {item.icon}
//               {item.name}
//             </NavLink>
//           ))}
//         </nav>
//       </div>

//       <div className="flex flex-col gap-2 border-t border-slate-700 pt-4">
//         <NavLink to="/settings" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800">
//           <Settings size={18} /> Settings
//         </NavLink>
//         <NavLink to="/help-support" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800">
//           <HelpCircle size={18} /> Help & Support
//         </NavLink>
//       </div>
//     </div>
//   );
// }


//#issue 1(fixed): left sidebar is static

function Sidebar() {
  const menuItems = [
    { name: "Dashboard", icon: <Home size={18} />, path: "/" },
    { name: "Port Scanner", icon: <Search size={18} />, path: "/port-scanner" },
    { name: "IoT Vulnerability Checker", icon: <Shield size={18} />, path: "/iot-vuln-checker" },
    { name: "ML IP Analyzer", icon: <Cpu size={18} />, path: "/ml-ip-analyzer" },
    { name: "Network Map", icon: <Map size={18} />, path: "/network-map" },
  ];

  return (
    <div className="bg-slate-900 dark:bg-gray-900 text-white w-64 flex flex-col flex-shrink-0 h-full"> {/* Added flex-shrink-0 and h-full */}
      <div className="flex-1 overflow-hidden flex flex-col"> {/* Added overflow-hidden and flex-col */}
        <div className="p-4"> {/* Added padding container */}
          <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <img src={logo} alt="ShellSweep Logo" className="w-6 h-6" />
            ShellSweep
          </h1>
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-2 rounded-lg transition-colors duration-200 hover:bg-slate-800 dark:hover:bg-gray-800 ${
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

      {/* Bottom Section - This will always be visible at the bottom */}
      <div className="p-4 border-t border-slate-700 dark:border-gray-700 flex-shrink-0"> {/* Added flex-shrink-0 */}
        <div className="flex flex-col gap-2">
          <NavLink to="/settings" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 dark:hover:bg-gray-800">
            <Settings size={18} /> Settings
          </NavLink>
          <NavLink to="/help-support" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 dark:hover:bg-gray-800">
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
    <div className="flex items-center bg-white dark:bg-gray-900 p-4 shadow relative">
      <PageTitle />

      <div className="flex items-center gap-2">
        <button
          onClick={toggleInvertColors}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          title={invertColors ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {invertColors ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-600 dark:text-gray-300" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <Bell size={20} />
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-4 font-semibold border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">Notifications</div>
              <div className="p-4 text-gray-500 dark:text-gray-400">No new notifications</div>
            </div>
          )}
        </div>

        <button
          onClick={() => window.print()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <Printer size={20} />
        </button>

        <button
          onClick={() => setShowHelp(true)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-96 p-6 relative">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Frequently Asked Questions</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
              <li>Nullam scelerisque nunc sit amet lacus consequat.</li>
              <li>Vestibulum ante ipsum primis in faucibus orci luctus.</li>
              <li>Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.</li>
            </ul>
            <button
              onClick={() => setShowHelp(false)}
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
        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-1/2 min-w-[500px] max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 font-medium text-gray-900 dark:text-white ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-6 py-3 font-medium text-gray-900 dark:text-white ${activeTab === 'about' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
          >
            About
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-medium text-gray-900 dark:text-white">Appearance</h1>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-white">Theme</span>
                    <select className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option>Light</option>
                      <option>Dark</option>
                      <option>System</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-white">Font Size</span>
                    <select className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option>Small</option>
                      <option>Medium</option>
                      <option>Large</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h1 className="font-medium mb-3 text-gray-900 dark:text-white">Notifications</h1>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-white">Email alerts</span>
                    <input type="checkbox" className="h-4 w-4" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-white">Sound notifications</span>
                    <input type="checkbox" className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="flex flex-col items-center text-center">
              <img
                src="/logos/shellsweep-dark.png"
                alt="ShellSweep"
                className="w-40 h-40 mb-4 drop-shadow-lg"
              />
              <p className="mb-4 text-gray-600 dark:text-gray-400 font-medium">"Hunting Threats where Firewalls can't Reach"</p>
              <p className="text-sm mb-4 text-gray-900 dark:text-white">Version 0.0.3 (beta)</p>
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 w-full">
                <p className="text-sm text-gray-900 dark:text-white">Developed in 🇵🇰 with 💙 By</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Syed Ahmed Haroon, Hassan Javed, Faraz Hashmi, Daniyal Mirza</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
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


// TypeScript interface for device data
interface Device {
  ip: string;
  hostname: string;
  type: 'router' | 'computer' | 'iot' | 'mobile' | 'unknown';
  status: 'active' | 'warning' | 'danger' | 'inactive';
  mac?: string;
  vendor?: string;
}

// TypeScript interface for port data
interface Port {
  ip: string;
  port: number;
  protocol: string;
  service: string;
  state: string;
  version: string;
}


//network map k liye "visual map" dala tha ye nhi bhulun ga mein
// ye purana wala visual map hai neeche jo ap dkeh rhy ho ismein refresh nhi hai
// function VisualMap() {
//   const [devices, setDevices] = useState<Device[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch devices from backend API
//   useEffect(() => {
//     const fetchDevices = async () => {
//       try {
//         const response = await fetch('http://localhost:8000/');
        
//         if (!response.ok) {
//           throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const data = await response.json();
        
//         // Validate response structure
//         if (!data || !Array.isArray(data.devices)) {
//           throw new Error("Invalid data format: expected array of devices");
//         }

//         // Stronger validation for device objects
//         const validatedDevices: Device[] = data.devices.map((device: Partial<Device>, index: number) => {
//           // Always fallback gracefully if fields are missing
//           const ip =
//             typeof device.ip === "string" && device.ip.trim() !== ""
//               ? device.ip
//               : `Unknown-IP-${index}`;

//           const hostname =
//             typeof device.hostname === "string" && device.hostname.trim() !== ""
//               ? device.hostname
//               : `Unknown-${ip}`;

//           // Validate type with fallback
//           const validTypes: Device["type"][] = ["router", "computer", "iot", "mobile", "unknown"];
//           const type =
//             typeof device.type === "string" && validTypes.includes(device.type as Device["type"])
//               ? (device.type as Device["type"])
//               : "unknown";

//           // Validate status with fallback
//           const validStatuses: Device["status"][] = ["active", "warning", "danger", "inactive"];
//           const status =
//             typeof device.status === "string" && validStatuses.includes(device.status as Device["status"])
//               ? (device.status as Device["status"])
//               : "inactive";

//           return {
//             ip,
//             hostname,
//             type,
//             status,
//           };
//         });


//         setDevices(validatedDevices);
//       } catch (err) {
//         console.error('Failed to fetch devices:', err);
//         setError(err instanceof Error ? err.message : 'Unknown error');
//         setDevices([]); // Reset to empty array on error
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDevices();
//   }, []);

//   // Helper functions
//   const getStatusColor = (status: string) => {
//     switch(status) {
//       case 'active': return 'bg-green-500';
//       case 'warning': return 'bg-yellow-500';
//       case 'danger': return 'bg-red-500';
//       default: return 'bg-gray-400';
//     }
//   };

//   const getDeviceColor = (type: string) => {
//     switch(type) {
//       case 'router': return 'bg-blue-500';
//       case 'computer': return 'bg-purple-500';
//       case 'iot': return 'bg-green-500';
//       case 'mobile': return 'bg-pink-500';
//       default: return 'bg-gray-500';
//     }
//   };

//   // Calculate positions for devices
//   const calculatePosition = (index: number, total: number) => {
//     const angle = (index * (360 / total)) * (Math.PI / 180);
//     const radius = Math.min(200, window.innerWidth / 4);
//     return {
//       x: Math.cos(angle) * radius,
//       y: Math.sin(angle) * radius
//     };
//   };

//   // Loading/error states
//   if (loading) {
//     return (
//       <div className="bg-white rounded-xl p-6 shadow">
//         <h2 className="text-xl font-semibold mb-4">Network Map</h2>
//         <div className="flex items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-white rounded-xl p-6 shadow">
//         <h2 className="text-xl font-semibold mb-4">Network Map</h2>
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
//           <p className="font-medium">Error loading devices:</p>
//           <p>{error}</p>
//           <button 
//             onClick={() => window.location.reload()}
//             className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (devices.length === 0) {
//     return (
//       <div className="bg-white rounded-xl p-6 shadow">
//         <h2 className="text-xl font-semibold mb-4">Network Map</h2>
//         <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700">
//           No devices found on the network.
//         </div>
//       </div>
//     );
//   }

//   // Find router (center device)
//   const router = devices.find(d => d.type === 'router') || devices[0];
//   const connectedDevices = devices.filter(d => d.ip !== router.ip);

//   return (
//     <div className="bg-white rounded-xl p-6 shadow">
//       <h2 className="text-xl font-semibold mb-4">Network Map</h2>
      
//       <div className="relative h-[70vh] border rounded-lg bg-gray-50 flex items-center justify-center">
//         {/* Router (Center) */}
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
//           <div className={`w-16 h-16 ${getDeviceColor(router.type)} rounded-full flex flex-col items-center justify-center text-white shadow-md`}>
//             <Wifi size={24} />
//             <span className="text-xs mt-1">{router.hostname.split('-')[0]}</span>
//             <span className={`absolute -top-1 -right-1 w-3 h-3 ${getStatusColor(router.status)} rounded-full border-2 border-white`}></span>
//           </div>
//         </div>
        
//         {/* Connected Devices */}
//         {connectedDevices.map((device, index) => {
//           const { x, y } = calculatePosition(index, connectedDevices.length);
          
//           return (
//             <div 
//               key={device.ip}
//               className={`absolute w-12 h-12 ${getDeviceColor(device.type)} rounded-full flex items-center justify-center text-white text-xs z-10 shadow-md`}
//               style={{
//                 left: `calc(50% + ${x}px)`,
//                 top: `calc(50% + ${y}px)`,
//                 transform: 'translate(-50%, -50%)'
//               }}
//               title={`${device.hostname}\n${device.ip}\nStatus: ${device.status}`}
//             >
//               {device.hostname.split('-')[0]}
//               <span className={`absolute -top-1 -right-1 w-3 h-3 ${getStatusColor(device.status)} rounded-full border-2 border-white`}></span>
//             </div>
//           );
//         })}
        
//         {/* Connection Lines */}
//         <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
//           {connectedDevices.map((device, index) => {
//             const { x, y } = calculatePosition(index, connectedDevices.length);
            
//             return (
//               <line
//                 key={`line-${device.ip}`}
//                 x1="50%"
//                 y1="50%"
//                 x2={`calc(50% + ${x}px)`}
//                 y2={`calc(50% + ${y}px)`}
//                 stroke="#94a3b8"
//                 strokeWidth="2"
//                 strokeDasharray={device.status === 'inactive' ? '5,5' : '0'}
//               />
//             );
//           })}
//         </svg>
//       </div>
      
//       {/* Legends */}
//       <div className="mt-6">
//         <h3 className="font-medium mb-2">Device Types</h3>
//         <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm mb-4">
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
//             <span>Router</span>
//           </div>
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
//             <span>Computer</span>
//           </div>
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
//             <span>IoT</span>
//           </div>
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
//             <span>Mobile</span>
//           </div>
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
//             <span>Unknown</span>
//           </div>
//         </div>
        
//         <h3 className="font-medium mb-2">Status Indicators</h3>
//         <div className="grid grid-cols-4 gap-2 text-sm">
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
//             <span>Active</span>
//           </div>
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
//             <span>Warning</span>
//           </div>
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
//             <span>Critical</span>
//           </div>
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
//             <span>Inactive</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

//idher se port scnanner wali tab shuru hai

//#002 implementation of visual map with refresh button
// function VisualMap() {
//   const [devices, setDevices] = useState([
//     { ip: '192.168.1.1', hostname: 'Router', type: 'router', status: 'active' },
//     { ip: '192.168.1.2', hostname: 'Workstation-1', type: 'computer', status: 'active' },
//     { ip: '192.168.1.3', hostname: 'Security-Cam', type: 'iot', status: 'warning' },
//     { ip: '192.168.1.4', hostname: 'Phone-Adam', type: 'mobile', status: 'active' },
//     { ip: '192.168.1.5', hostname: 'Unknown-Device', type: 'unknown', status: 'inactive' },
//   ]);
//   const [loading, setLoading] = useState(false);
//   const [refreshCount, setRefreshCount] = useState(0);

//   const getStatusColor = (status: string) => {
//     switch(status) {
//       case 'active': return 'bg-green-500';
//       case 'warning': return 'bg-yellow-500';
//       case 'danger': return 'bg-red-500';
//       default: return 'bg-gray-400';
//     }
//   };

//   const getDeviceColor = (type: string) => {
//     switch(type) {
//       case 'router': return 'bg-blue-500';
//       case 'computer': return 'bg-purple-500';
//       case 'iot': return 'bg-green-500';
//       case 'mobile': return 'bg-pink-500';
//       default: return 'bg-gray-500';
//     }
//   };

//   const handleRefresh = async () => {
//     setLoading(true);
//     try {
//       // Simulate API call delay
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       // Replace this with actual API call to your Python backend
//       const response = await fetch('http://localhost:8000/');
//       const data = await response.json();
//       setDevices(data.devices); // Use real data from backend
      
//       setRefreshCount(prev => prev + 1);
//     } catch (error) {
//       console.error('Error refreshing data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-white rounded-xl p-6 shadow">
//       {/* Header with Title and Refresh Button */}
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-xl font-semibold">Scan Results</h2>
//         <button
//           onClick={handleRefresh}
//           disabled={loading}
//           className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
//         >
//           <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
//           {loading ? "Scanning..." : "Refresh Scan"}
//         </button>
//       </div>
      
//       {/* Network Visualization */}
//       <div className="relative h-96 border rounded-lg bg-gray-50 flex items-center justify-center">
//         {loading ? (
//           <div className="flex flex-col items-center gap-2">
//             <RefreshCw size={32} className="animate-spin text-blue-500" />
//             <p className="text-gray-600">Scanning network...</p>
//           </div>
//         ) : (
//           <>
//             {/* Router (Center) */}
//             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
//               <div className={`w-16 h-16 ${getDeviceColor('router')} rounded-full flex flex-col items-center justify-center text-white`}>
//                 <Wifi size={24} />
//                 <span className="text-xs mt-1">Router</span>
//               </div>
//             </div>
            
//             {/* Connected Devices */}
//             {devices.filter(d => d.ip !== '192.168.1.1').map((device, index) => {
//               const angle = (index * (360 / (devices.length - 1))) * (Math.PI / 180);
//               const radius = 120;
//               const x = Math.cos(angle) * radius;
//               const y = Math.sin(angle) * radius;
              
//               return (
//                 <div 
//                   key={`${device.ip}-${refreshCount}`}
//                   className={`absolute w-12 h-12 ${getDeviceColor(device.type)} rounded-full flex items-center justify-center text-white text-xs z-10`}
//                   style={{
//                     left: `calc(50% + ${x}px)`,
//                     top: `calc(50% + ${y}px)`,
//                     transform: 'translate(-50%, -50%)'
//                   }}
//                   title={`${device.hostname}\n${device.ip}\nStatus: ${device.status}`}
//                 >
//                   {device.hostname.split('-')[0]}
//                   <span className={`absolute -top-1 -right-1 w-3 h-3 ${getStatusColor(device.status)} rounded-full border-2 border-white`}></span>
//                 </div>
//               );
//             })}
            
//             {/* Connection Lines */}
//             <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
//               {devices.filter(d => d.ip !== '192.168.1.1').map((device, index) => {
//                 const angle = (index * (360 / (devices.length - 1))) * (Math.PI / 180);
//                 const x = Math.cos(angle) * 120;
//                 const y = Math.sin(angle) * 120;
                
//                 return (
//                   <line
//                     key={`line-${device.ip}-${refreshCount}`}
//                     x1="50%"
//                     y1="50%"
//                     x2={`calc(50% + ${x}px)`}
//                     y2={`calc(50% + ${y}px)`}
//                     stroke="#94a3b8"
//                     strokeWidth="2"
//                     strokeDasharray={device.status === 'inactive' ? '5,5' : '0'}
//                   />
//                 );
//               })}
//             </svg>
//           </>
//         )}
//       </div>
      
//       {/* Legends */}
//       <div className="mt-6">
//         <h3 className="font-medium mb-2">Device Types</h3>
//         <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm mb-4">
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
//             <span>Router</span>
//           </div>
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
//             <span>Computer</span>
//           </div>
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
//             <span>IoT</span>
//           </div>
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
//             <span>Mobile</span>
//           </div>
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
//             <span>Unknown</span>
//           </div>
//         </div>
        
//         <h3 className="font-medium mb-2">Status Indicators</h3>
//         <div className="grid grid-cols-3 gap-2 text-sm">
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
//             <span>Active</span>
//           </div>
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
//             <span>Warning</span>
//           </div>
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
//             <span>Critical</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

//#003 implementation without mock data

function VisualMap() {
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

  const [openPorts, setOpenPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string | boolean) => {
    setScanConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleStartScan = async () => {
    setLoading(true);
    setError(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scan');
      console.error('Error starting scan:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
          Error: {error}
        </div>
      )}

      {/* Port Scan Configuration Card */}
      <div className="bg-white dark:bg-gray-900 shadow rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Port Scan Configuration</h2>

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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Open Ports</h2>
          <div className="flex gap-2">
            <button className="border border-gray-300 dark:border-gray-600 px-3 py-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm flex items-center gap-1">
              <Filter size={14} />
              Filter
            </button>
            <button className="border border-gray-300 dark:border-gray-600 px-3 py-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm flex items-center gap-1">
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
                  Version
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
                    {port.service}
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
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {port.version}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
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
  const [currentScan, setCurrentScan] = useState<any>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPortsCount = currentScan?.results?.length || 0;
  const devicesCount = devices.length;
  const lastScanDate = currentScan?.timestamp ? new Date(currentScan.timestamp).toLocaleDateString() : 'No scan yet';

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h3>

          <div className="grid grid-cols-4 gap-4 mb-6">
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
          <div className="grid grid-cols-2 gap-4 mb-6">
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
              <p className="text-gray-500 dark:text-gray-400">Connected Devices</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{devicesCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{devices.filter(d => d.type === 'iot').length} IoT devices</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-gray-500 dark:text-gray-400">Unique IPs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{new Set(devices.map(d => d.ip)).size}</p>
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

function NetworkMapPage() {
  return (
    <div className="p-6">
      <VisualMap />
    </div>
  );
}



// function NetworkMapPage() {
//   const [refreshKey, setRefreshKey] = useState(0);

//   const handleRefresh = () => {
//     setRefreshKey(prev => prev + 1);
//   };

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-xl font-semibold">Network Map</h2>
//         <button
//           onClick={handleRefresh}
//           className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
//         >
//           <RefreshCw size={16} />
//           Refresh Scan
//         </button>
//       </div>
      
//       {/* Key prop change forces VisualMap to remount and refetch */}
//       <VisualMap key={refreshKey} />
//     </div>
//   );
// }


function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6">
      <p className="text-gray-500 dark:text-gray-400">This is a placeholder for the {title} page.</p>
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
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Help & Support</h2>
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
        <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Contact Support</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Email: support@shellsweep.com</p>
        <p className="text-gray-600 dark:text-gray-400">Phone: +92 300 1234567</p>
      </div>
    </div>
  );
}

// export default function App() {
//   const [invertColors, setInvertColors] = useState(false);
//   const [showSettingsModal, setShowSettingsModal] = useState(false);

//   const toggleInvertColors = () => {
//     setInvertColors(!invertColors);
//   };

//   useEffect(() => {
//     if (invertColors) {
//       document.documentElement.style.filter = "invert(1) hue-rotate(178deg)";
//     } else {
//       document.documentElement.style.filter = "none";
//     }
//   }, [invertColors]);

//   return (
//     <Router>
//       <div className="flex">
//         <Sidebar />
//         <div className="flex-1 bg-gray-100 min-h-screen flex flex-col">
//           <TopBar invertColors={invertColors} toggleInvertColors={toggleInvertColors} />
//           <div className="flex-1">
//             <Routes>
//               <Route path="/" element={<Dashboard />} />
//               <Route path="/port-scanner" element={<PlaceholderPage title="Port Scanner" />} />
//               <Route path="/iot-vuln-checker" element={<PlaceholderPage title="IoT Vulnerability Checker" />} />
//               <Route path="/ml-ip-analyzer" element={<PlaceholderPage title="ML IP Analyzer" />} />
//               <Route path="/network-map" element={<NetworkMapPage />} />
//               <Route 
//                 path="/settings" 
//                 element={<SettingsPage onModalOpen={() => setShowSettingsModal(true)} />} 
//               />
//               <Route path="/help-support" element={<HelpSupportPage />} />
//             </Routes>
//           </div>
//         </div>
//       </div>
      
//       <SettingsModal show={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
//     </Router>
//   );

//}

//#002 implementation with left side bar scrollable 


//#003 below is left side bar non scrollable


export default function App() {
  const [invertColors, setInvertColors] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const toggleInvertColors = () => {
    setInvertColors(!invertColors);
  };

  useEffect(() => {
    if (invertColors) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [invertColors]);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden"> {/* Changed to h-screen and overflow-hidden */}
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0"> {/* Added min-h-0 for proper flexbox scrolling */}
          <TopBar invertColors={invertColors} toggleInvertColors={toggleInvertColors} />
          <div className="flex-1 overflow-auto"> {/* Added overflow-auto for scrollable content */}
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/port-scanner" element={<PortScanner />} /> {/* Fixed: Changed from PlaceholderPage to PortScanner */}
              <Route path="/iot-vuln-checker" element={<PlaceholderPage title="IoT Vulnerability Checker" />} />
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

