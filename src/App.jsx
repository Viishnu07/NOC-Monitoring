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
      
      // Fetch data relative to the Vite base URL
      const baseUrl = import.meta.env.BASE_URL;

      const statusRes = await fetch(`${baseUrl}status.json?t=${ts}`);
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
      
      const historyRes = await fetch(`${baseUrl}history.json?t=${ts}`);
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
    <div className={`min-h-screen relative transition-colors duration-500 bg-background selection:bg-accent/30`}>
      
      {/* Professional Alert Banner */}
      {criticalAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4 transition-all duration-300 animate-in slide-in-from-top-4">
          <div className={`flex items-center justify-between p-4 rounded-xl shadow-lg border ${alertType === 'down' ? 'bg-white border-red-200 shadow-red-100/50' : 'bg-white border-emerald-200 shadow-emerald-100/50'}`}>
             <div className="flex items-center gap-3">
                <span className={`flex items-center justify-center w-10 h-10 rounded-full ${alertType === 'down' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {alertType === 'down' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  )}
                </span>
                <div>
                  <h3 className={`text-sm font-bold ${alertType === 'down' ? 'text-red-700' : 'text-emerald-700'}`}>
                    {alertType === 'down' ? 'Outage Detected' : 'System Recovered'}
                  </h3>
                  <p className="text-slate-600 text-sm font-medium">{criticalAlert}</p>
                </div>
             </div>
             <button 
               onClick={() => setCriticalAlert(null)} 
               className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
               aria-label="Dismiss"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-card px-2 py-2 rounded-full hidden md:flex items-center gap-2 border border-border shadow-2xl">
        <button 
          onClick={() => setCurrentView('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'bg-accent/10 text-accent font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          <LayoutDashboard size={16} /> Dashboard
        </button>
        <button 
          onClick={() => setCurrentView('report')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${currentView === 'report' ? 'bg-accent/10 text-accent font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          <FileText size={16} /> Reporting Suite
        </button>
      </nav>

      {/* Mobile nav */}
      <nav className="md:hidden flex border-b border-border bg-card">
         <button 
          onClick={() => setCurrentView('dashboard')}
          className={`flex-1 py-4 flex justify-center items-center gap-2 text-sm font-medium ${currentView === 'dashboard' ? 'text-accent border-b-2 border-accent' : 'text-slate-500'}`}
        >
          <LayoutDashboard size={16} /> Dashboard
        </button>
        <button 
          onClick={() => setCurrentView('report')}
         className={`flex-1 py-4 flex justify-center items-center gap-2 text-sm font-medium ${currentView === 'report' ? 'text-accent border-b-2 border-accent' : 'text-slate-500'}`}
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
