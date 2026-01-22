import React, { useState } from 'react';
import DashboardLayout from './components/DashboardLayout';
import { UploadView } from './components/UploadView';
import { ProcessingView } from './components/ProcessingView';
import { ResultsView } from './components/ResultsView';
import axios from 'axios';

function App() {
  const [activeTab, setActiveTab] = useState('new-project');
  const [view, setView] = useState('upload'); // upload, processing, results
  const [files, setFiles] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [results, setResults] = useState(null);

  const handleProcess = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      setView('processing');
      // Start upload & annotation request
      const res = await axios.post('http://localhost:8000/api/annotate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSessionId(res.data.session_id);
      setResults(res.data);
      // ProcessingView handles checking actual progress status now
    } catch (error) {
      console.error("Upload error", error);
      alert("Error starting process. Check backend console.");
      setView('upload');
    }
  };

  const handleProcessingComplete = () => {
    setView('results');
  };

  const handleReset = () => {
    setFiles([]);
    setSessionId(null);
    setResults(null);
    setView('upload');
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'new-project' && (
        <>
          {view === 'upload' && (
            <UploadView
              files={files}
              setFiles={setFiles}
              onProcess={handleProcess}
            />
          )}

          {view === 'processing' && (
            <ProcessingView
              sessionId={sessionId}
              onComplete={handleProcessingComplete}
            />
          )}

          {view === 'results' && results && (
            <ResultsView
              results={results}
              sessionId={sessionId}
              onReset={handleReset}
            />
          )}
        </>
      )}

      {activeTab === 'library' && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
          <p className="text-lg font-medium">Coming Soon</p>
          <p className="text-sm">Historical projects will appear here.</p>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold font-display mb-6">Settings</h2>
          <div className="p-6 rounded-xl bg-surface border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <span>Model Version</span>
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm">SAM 2.1 Large</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Processing Device</span>
              <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm">CUDA (GPU)</span>
            </div>
            <div className="pt-4 border-t border-white/5 text-sm text-gray-500">
              Auto-Mark v1.0.0 • Built by Kunj
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default App;
