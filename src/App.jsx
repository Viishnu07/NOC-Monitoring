import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import ReportView from './components/ReportView';
import { LayoutDashboard, FileText } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [statusData, setStatusData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  
  const previousStatusRef = useRef(null);
  const [criticalAlert, setCriticalAlert] = useState(null);
  const [alertType, setAlertType] = useState(''); // 'down' or 'up'

  const playSiren = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      for (let i = 0; i < 6; i++) {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, audioCtx.currentTime + i * 0.4);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime + i * 0.4);
        osc.start(audioCtx.currentTime + i * 0.4);
        osc.stop(audioCtx.currentTime + (i + 1) * 0.4);
      }
    } catch (e) {
      console.warn("Audio blocked by browser policy. Please interact with the page first.");
    }
  };

  const triggerPushNotification = (title, body) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(title, { body });
        }
      });
    }
  };

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.5); // C6
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 1);
    } catch (e) {
      console.warn("Audio blocked");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const ts = new Date().getTime();
      
      // If we are live on GitHub Pages, read the raw files straight from the repo's main branch!
      // This saves us from having to rebuild the entire React website every 5 minutes.
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocal 
        ? '' 
        : 'https://raw.githubusercontent.com/Viishnu07/NOC-Monitoring/main/public';

      const statusRes = await fetch(`${baseUrl}/status.json?t=${ts}`);
      if (statusRes.ok) {
        const data = await statusRes.json();
        
        // Check for State Changes
        if (previousStatusRef.current) {
           const oldStatus = previousStatusRef.current;
           const newDowns = data.filter(n => n.status === 'DOWN').filter(n => {
               const oldNode = oldStatus.find(o => o.url === n.url || o.ip === n.ip);
               return oldNode && oldNode.status === 'UP';
           });
           const newUps = data.filter(n => n.status === 'UP').filter(n => {
               const oldNode = oldStatus.find(o => o.url === n.url || o.ip === n.ip);
               return oldNode && oldNode.status === 'DOWN';
           });

           if (newDowns.length > 0) {
               const msg = `${newDowns.map(n => n.name).join(', ')} OFFLINE`;
               setCriticalAlert(msg);
               setAlertType('down');
               playSiren();
               triggerPushNotification("🚨 CRITICAL NOC ALERT", msg);
           } else if (newUps.length > 0) {
               const msg = `${newUps.map(n => n.name).join(', ')} BACK ONLINE`;
               setCriticalAlert(msg);
               setAlertType('up');
               playChime();
               triggerPushNotification("✅ SYSTEM RECOVERED", msg);
               setTimeout(() => setCriticalAlert(null), 10000); // clear recovery msg after 10s
           }
        }
        previousStatusRef.current = data;
        setStatusData(data);
      }
      
      const historyRes = await fetch(`${baseUrl}/history.json?t=${ts}`);
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
    <div className={`min-h-screen relative transition-colors duration-1000 ${criticalAlert && alertType === 'down' ? 'bg-danger/10' : 'bg-background'} selection:bg-success/30`}>
      
      {/* Massive Web Pop-Up Modal */}
      {criticalAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className={`p-8 rounded-3xl shadow-2xl max-w-lg w-full mx-4 border mt-[-10vh] ${alertType === 'down' ? 'bg-slate-900 border-danger/50 shadow-danger/20 animate-pulse' : 'bg-slate-900 border-success/50 shadow-success/20'}`}>
             <div className="flex flex-col items-center text-center gap-4">
                <span className="text-6xl mb-2">{alertType === 'down' ? '🚨' : '✅'}</span>
                <h2 className={`text-2xl font-bold tracking-tight ${alertType === 'down' ? 'text-danger' : 'text-success'}`}>
                  {alertType === 'down' ? 'CRITICAL OUTAGE DETECTED' : 'SYSTEM RECOVERED'}
                </h2>
                <p className="text-white text-lg font-medium bg-black/30 w-full py-4 rounded-xl border border-white/10 uppercase tracking-wider">{criticalAlert}</p>
                <button 
                  onClick={() => setCriticalAlert(null)} 
                  className="mt-6 px-8 py-3.5 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white rounded-xl font-bold w-full transition-all"
                >
                  Acknowledge & Dismiss
                </button>
             </div>
          </div>
        </div>
      )}

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
