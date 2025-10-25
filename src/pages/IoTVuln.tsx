import { useState, useRef } from "react";
import { Upload, FileText, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Download, Terminal as TerminalIcon } from "lucide-react";

interface StageInfo {
  name: string;
  status: "success" | "failed" | "skipped";
  duration_ms: number;
  stdout_tail?: string;
  stderr_tail?: string;
}

interface ExtractionSummary {
  filesystems?: string[];
  kernel_found?: boolean;
  rootfs_count?: number;
  vendor_hints?: string[];
}

interface ArtifactInfo {
  type: string;
  path: string;
  size: number;
  notes?: string;
}

interface AnalysisResult {
  status: "success" | "error";
  // Legacy fields
  output?: string;
  message?: string;
  debug?: string;
  // New structured fields
  session_id?: string;
  sha256?: string;
  summary?: ExtractionSummary;
  artifacts?: ArtifactInfo[];
  stages?: StageInfo[];
  limits?: { max_bytes: number; timeout_s: number; depth_limit: number };
}

export default function IoTVuln() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logsOpen, setLogsOpen] = useState(true);
  const [showStages, setShowStages] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch("/firmware/analyze_firmware", {
        method: "POST",
        body: form,
      });
      const data: AnalysisResult = await resp.json();
      if (!resp.ok || data.status === "error") {
        setError(data.message || `HTTP ${resp.status}`);
        setResult(data);
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to analyze firmware");
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadOutput = () => {
    if (!result?.output) return;
    const blob = new Blob([result.output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name || "firmware"}-analysis.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">IoT Firmware Vulnerability Analysis</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload a firmware image to analyze for known weaknesses, misconfigurations, and indicators of compromise.</p>
          </div>
          <button onClick={reset} className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
            <RefreshCw size={16} className={analyzing ? "animate-spin" : ""} /> Reset
          </button>
        </div>

        {/* Uploader */}
        <div className="mt-6">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-800">
            <input ref={inputRef} type="file" accept=".bin,.img,.zip,.tar,.tgz,.gz,.xz,.7z,.rar,.ubi,.squashfs,.ext,.tar.gz,.tar.xz" className="hidden" onChange={handleFileChange} />

            {!file ? (
              <div className="flex flex-col items-center justify-center text-center">
                <Upload size={40} className="text-gray-400" />
                <p className="mt-3 text-gray-700 dark:text-gray-200 font-medium">Drag and drop your firmware file here</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Supported: bin, img, zip, tar, tgz, gz, xz, 7z, rar, ubi, squashfs, ext</p>
                <button onClick={handleUploadClick} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Choose File</button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleUploadClick} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Change</button>
                  <button onClick={reset} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Remove</button>
                  <button onClick={analyze} disabled={analyzing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg flex items-center gap-2">
                    <Upload size={16} className={analyzing ? "animate-bounce" : ""} />
                    {analyzing ? "Analyzing..." : "Analyze"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-gray-900 shadow rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Results</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setLogsOpen(v => !v)} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
              {logsOpen ? "Hide Logs" : "Show Logs"}
            </button>
            <button onClick={downloadOutput} disabled={!result?.output} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50">
              <Download size={14} /> Save Output
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {analyzing && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center gap-2">
            <RefreshCw size={16} className="animate-spin" /> Running analysis in WSL environment...
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 flex items-center gap-2">
            <XCircle size={16} /> {error}
          </div>
        )}
        {result && !error && result.status === "success" && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 flex items-center gap-2">
            <CheckCircle2 size={16} /> Analysis completed successfully
          </div>
        )}
        {result && !error && result.status === "error" && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 flex items-center gap-2">
            <AlertTriangle size={16} /> Analyzer returned an error. Check debug logs below.
          </div>
        )}

        {/* Structured Results: Summary, Stages, Artifacts */}
        {result?.summary ? (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Filesystems</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{result.summary.filesystems?.length || 0}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{(result.summary.filesystems || []).join(', ') || 'None'}</p>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Kernel Found</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{result.summary.kernel_found ? 'Yes' : 'No'}</p>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Rootfs Count</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{result.summary.rootfs_count || 0}</p>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Vendor Hints</p>
                <p className="text-xs text-gray-700 dark:text-gray-300">{(result.summary.vendor_hints || []).join(', ') || 'None'}</p>
              </div>
            </div>

            {/* Stages */}
            <div className="border rounded-lg">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Stages</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Depth limit: {result.limits?.depth_limit} • Timeout: {result.limits?.timeout_s}s</p>
                </div>
                <button onClick={() => setShowStages(v => !v)} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                  {showStages ? 'Hide' : 'Show'}
                </button>
              </div>
              {showStages && (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(result.stages || []).map((s, idx) => (
                    <div key={idx} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.status === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                            s.status === 'failed' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>{s.status.toUpperCase()}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{s.duration_ms} ms</div>
                      </div>
                      {(s.stdout_tail || s.stderr_tail) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-2">
                          <pre className="p-2 text-xs whitespace-pre-wrap break-words max-h-64 overflow-auto bg-white dark:bg-gray-900 border rounded">{s.stdout_tail || '—'}</pre>
                          <pre className="p-2 text-xs whitespace-pre-wrap break-words max-h-64 overflow-auto bg-white dark:bg-gray-900 border rounded">{s.stderr_tail || '—'}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Artifacts */}
            <div className="border rounded-lg">
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Artifacts</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-3 py-2">Type</th>
                      <th className="text-left px-3 py-2">Path (relative)</th>
                      <th className="text-left px-3 py-2">Size</th>
                      <th className="text-left px-3 py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result.artifacts || []).slice(0, 500).map((a, i) => (
                      <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{a.type}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 font-mono break-all">{a.path}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{(a.size/1024).toFixed(1)} KB</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{a.notes || ''}</td>
                      </tr>
                    ))}
                    {(!result.artifacts || result.artifacts.length === 0) && (
                      <tr><td colSpan={4} className="px-3 py-3 text-gray-500">No artifacts recorded</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          // Legacy fallback to stdout/debug panes
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b text-sm flex items-center gap-2">
                <TerminalIcon size={16} /> Stdout
              </div>
              <pre className="p-3 text-xs whitespace-pre-wrap break-words max-h-[50vh] overflow-auto text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900">
                {result?.output || "No output yet"}
              </pre>
            </div>
            {logsOpen && (
              <div className="border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b text-sm flex items-center gap-2">
                  <TerminalIcon size={16} /> Stderr / Debug
                </div>
                <pre className="p-3 text-xs whitespace-pre-wrap break-words max-h-[50vh] overflow-auto text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900">
                  {result?.debug || result?.message || "No debug logs"}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
