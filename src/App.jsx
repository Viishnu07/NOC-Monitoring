import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ReportView from './components/ReportView';
import { LayoutDashboard, FileText } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [statusData, setStatusData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ts = new Date().getTime();
      const statusRes = await fetch(`/status.json?t=${ts}`);
      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatusData(data);
      }
      const historyRes = await fetch(`/history.json?t=${ts}`);
      if (historyRes.ok) {
        const hData = await historyRes.json();
        setHistoryData(hData);
      }
      setLastFetchTime(new Date());
    } catch (err) {
      console.error("Error fetching NOC data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative selection:bg-success/30">
      {/* Navigation */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-card px-2 py-2 rounded-full hidden md:flex items-center gap-2 border border-border shadow-2xl">
        <button 
          onClick={() => setCurrentView('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <LayoutDashboard size={16} /> Dashboard
        </button>
        <button 
          onClick={() => setCurrentView('report')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${currentView === 'report' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <FileText size={16} /> Reporting Suite
        </button>
      </nav>

      {/* Mobile nav */}
      <nav className="md:hidden flex border-b border-border bg-card">
         <button 
          onClick={() => setCurrentView('dashboard')}
          className={`flex-1 py-4 flex justify-center items-center gap-2 text-sm font-medium ${currentView === 'dashboard' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
        >
          <LayoutDashboard size={16} /> Dashboard
        </button>
        <button 
          onClick={() => setCurrentView('report')}
         className={`flex-1 py-4 flex justify-center items-center gap-2 text-sm font-medium ${currentView === 'report' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
        >
          <FileText size={16} /> Reports
        </button>
      </nav>

      <div className="pt-2 md:pt-20 pb-10">
        {currentView === 'dashboard' ? (
          <Dashboard 
             statusData={statusData} 
             historyData={historyData} 
             loading={loading} 
             lastFetchTime={lastFetchTime} 
             fetchData={fetchData} 
          />
        ) : (
          <ReportView historyData={historyData} />
        )}
      </div>
    </div>
  )
}

export default App
