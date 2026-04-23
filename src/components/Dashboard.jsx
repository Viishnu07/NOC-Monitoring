import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ServerCrash, Clock, Download, RefreshCw, Layers, Activity, History } from 'lucide-react';
import StatusCard from './StatusCard';
import ReportChart from './ReportChart';
import ReplayMode from './ReplayMode';

export default function Dashboard({ statusData, historyData, loading, lastFetchTime, fetchData }) {
  const dashboardRef = useRef();
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replaySnapshot, setReplaySnapshot] = useState([]);

  const enterReplay = () => {
    if (historyData.length === 0) return;
    setReplaySnapshot(historyData[historyData.length - 1].results);
    setIsReplayMode(true);
  };
  const exitReplay = () => setIsReplayMode(false);

  const displayData = isReplayMode ? replaySnapshot : statusData;

  const totalNodes = displayData.length;
  const onlineNodesData = displayData.filter(n => n.status === 'UP');
  const onlineNodes = onlineNodesData.length;
  const offlineNodes = totalNodes - onlineNodes;
  const degradedNodes = onlineNodesData.filter(n => n.responseTime > 1000).length;
  const avgLatency = onlineNodes > 0 
    ? Math.round(onlineNodesData.reduce((acc, curr) => acc + curr.responseTime, 0) / onlineNodes) 
    : 0;

  const uptimePercent = totalNodes > 0 ? Math.round((onlineNodes / totalNodes) * 100) : 0;
  const systemStatusColor = uptimePercent === 100 ? 'text-success' : (uptimePercent > 50 ? 'text-yellow-400' : 'text-danger');

  return (
    <div className="min-h-screen p-4 md:p-8 relative selection:bg-success/30">
      
      <div className="max-w-7xl mx-auto relative z-10" ref={dashboardRef}>
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-card border border-border shadow-sm">
              <Layers className={systemStatusColor} size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
                NOC Command Center
              </h1>
              <p className="text-slate-400 text-sm mt-1">Live infrastructure monitoring dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isReplayMode && (
              <div className="flex items-center gap-2 bg-orange-900/30 border border-orange-700 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                <span className="text-orange-400 text-xs font-bold tracking-widest">REPLAY</span>
              </div>
            )}
            <div className="text-xs text-slate-400 mr-2 flex items-center gap-2">
              <Clock size={14} />
              Last Updated: {lastFetchTime ? lastFetchTime.toLocaleTimeString() : '...'}
            </div>
            {historyData.length > 0 && (
              <button
                onClick={isReplayMode ? exitReplay : enterReplay}
                className={`p-2 rounded-lg border transition-colors group ${
                  isReplayMode
                    ? 'bg-orange-900/30 border-orange-700 text-orange-400 hover:bg-orange-900/50'
                    : 'bg-card border-border hover:bg-slate-700/50 text-slate-500 hover:text-slate-200'
                }`}
                title={isReplayMode ? 'Exit Replay Mode' : 'Enter Replay Mode'}
              >
                <History size={18} />
              </button>
            )}
            <button
              onClick={fetchData}
              disabled={loading || isReplayMode}
              className="p-2 rounded-lg bg-card border border-border hover:bg-slate-700/50 transition-colors group disabled:opacity-40 disabled:cursor-not-allowed"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={`text-slate-500 ${loading ? 'animate-spin' : 'group-hover:text-slate-200'}`} />
            </button>
          </div>
        </header>

        {/* Bento Board: Top Metrics */}
        <div className="grid grid-cols-12 gap-5 mb-10">
          
          {/* Hero Uptime Bento */}
          <div className="col-span-12 md:col-span-6 lg:col-span-5 bento-card p-8 flex flex-col justify-between min-h-[200px] border-t-4 border-t-success relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 text-slate-100">
              <ShieldCheck size={120} />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1 font-medium tracking-wide">SYSTEM UPTIME</p>
              <h3 className={`text-6xl font-black ${systemStatusColor} tracking-tighter`}>{uptimePercent}%</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-4">
              <span className={`w-3 h-3 rounded-full ${uptimePercent === 100 ? 'bg-success' : 'bg-danger'}`}></span>
              {onlineNodes} of {totalNodes} services operational
            </div>
          </div>
          
          {/* Secondary Stacked Bento */}
          <div className="col-span-12 md:col-span-6 lg:col-span-3 flex flex-col gap-5">
            <div className="bento-card p-6 flex-1 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs mb-1 font-medium tracking-wide">TOTAL NODES</p>
                <h3 className="text-3xl font-bold text-slate-100 tracking-tight">{totalNodes}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-900/30 flex items-center justify-center text-accent">
                <Layers size={24} />
              </div>
            </div>
            
            <div className="bento-card p-6 flex-1 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs mb-1 font-medium tracking-wide">DEGRADED</p>
                <h3 className={`text-3xl font-bold tracking-tight ${degradedNodes > 0 ? 'text-yellow-400' : 'text-slate-100'}`}>{degradedNodes}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-yellow-900/20 flex items-center justify-center text-yellow-400 font-bold text-[10px]">
                 WARN
              </div>
            </div>
          </div>
          
          {/* Latency Hero Bento */}
          <div className="col-span-12 lg:col-span-4 bento-card p-8 flex flex-col justify-between min-h-[200px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm mb-1 font-medium tracking-wide">AVG LATENCY</p>
                <h3 className={`text-5xl font-black tracking-tighter ${avgLatency > 1000 ? 'text-yellow-400' : (avgLatency > 500 ? 'text-orange-400' : 'text-slate-100')}`}>
                  {avgLatency} <span className="text-2xl text-slate-500 font-medium">ms</span>
                </h3>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${avgLatency > 500 ? 'bg-orange-900/30 text-orange-400' : 'bg-blue-900/30 text-accent'}`}>
                <Activity size={28} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              Global average response time across all active HTTP endpoints.
            </p>
          </div>
        </div>

        {/* Live Grid */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Live Services</h2>
          <div className="flex gap-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-success"></span> Online</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Degraded</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-danger"></span> Offline</span>
          </div>
        </div>
        
        {statusData.length === 0 ? (
          <div className="bento-card p-12 text-center flex flex-col items-center justify-center border border-border">
            {loading ? (
              <RefreshCw size={32} className="animate-spin text-slate-500 mb-4" />
            ) : (
              <ServerCrash size={32} className="text-slate-500 mb-4" />
            )}
            <p className="text-slate-400">{loading ? "Loading telemetry..." : "No targets found in status.json. Make sure the python monitor has run."}</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10 ${isReplayMode ? 'opacity-90' : ''}`}>
            {displayData.map((item, index) => (
              <StatusCard key={index} item={item} />
            ))}
          </div>
        )}

        {/* Replay Mode Scrubber Panel */}
        {isReplayMode && historyData.length > 0 && (
          <ReplayMode
            historyData={historyData}
            onReplayFrame={(snapshot) => setReplaySnapshot(snapshot)}
            onExit={exitReplay}
          />
        )}

        {/* Analytics Section */}
        <div className="mb-4 mt-8">
          <h2 className="text-xl font-semibold text-slate-100">Performance Analytics</h2>
        </div>
        <ReportChart historyData={historyData} />
        
      </div>
    </div>
  );
}
