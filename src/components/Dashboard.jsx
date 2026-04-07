import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ServerCrash, Clock, Download, RefreshCw, Layers, Activity } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import StatusCard from './StatusCard';
import ReportChart from './ReportChart';

export default function Dashboard({ statusData, historyData, loading, lastFetchTime, fetchData }) {
  const dashboardRef = useRef();

  const exportPDF = () => {
    const element = dashboardRef.current;
    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     `NOC_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#0B0F19' },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    
    // Add a temporary class to fix some styles for PDF if needed
    element.classList.add('pdf-export-mode');
    
    html2pdf().set(opt).from(element).save().then(() => {
       element.classList.remove('pdf-export-mode');
    });
  };

  // Calculate metrics
  const totalNodes = statusData.length;
  const onlineNodes = statusData.filter(n => n.status === 'UP').length;
  const offlineNodes = totalNodes - onlineNodes;
  const avgLatency = onlineNodes > 0 
    ? Math.round(statusData.filter(n => n.status === 'UP').reduce((acc, curr) => acc + curr.responseTime, 0) / onlineNodes) 
    : 0;

  const uptimePercent = totalNodes > 0 ? Math.round((onlineNodes / totalNodes) * 100) : 0;
  
  // Decide overall status glow
  const systemStatusColor = uptimePercent === 100 ? 'text-success' : (uptimePercent > 50 ? 'text-yellow-500' : 'text-danger');

  return (
    <div className="min-h-screen p-4 md:p-8 relative selection:bg-success/30">
      
      {/* Abstract Background Elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-emerald-900/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10" ref={dashboardRef}>
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-card border border-border shadow-lg`}>
              <Layers className={systemStatusColor} size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400 tracking-tight">
                NOC Command Center
              </h1>
              <p className="text-gray-400 text-sm mt-1">Live infrastructure monitoring dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 mr-2 flex items-center gap-2">
              <Clock size={14} />
              Last Updated: {lastFetchTime ? lastFetchTime.toLocaleTimeString() : '...'}
            </div>
            <button 
              onClick={fetchData} 
              disabled={loading}
              className="p-2 rounded-lg bg-card border border-border hover:bg-border transition-colors group"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={`text-gray-300 ${loading ? 'animate-spin' : 'group-hover:text-white'}`} />
            </button>
            <button 
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-900/20"
            >
              <Download size={16} /> Export Report
            </button>
          </div>
        </header>

        {/* Top KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1 uppercase tracking-wider font-semibold">Total Nodes</p>
              <h3 className="text-3xl font-bold text-white">{totalNodes}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Layers size={20} />
            </div>
          </div>
          
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1 uppercase tracking-wider font-semibold">System Uptime</p>
              <h3 className={`text-3xl font-bold ${systemStatusColor}`}>{uptimePercent}%</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
              <ShieldCheck size={20} />
            </div>
          </div>
          
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1 uppercase tracking-wider font-semibold">Offline Nodes</p>
              <h3 className={`text-3xl font-bold ${offlineNodes > 0 ? 'text-danger' : 'text-gray-300'}`}>{offlineNodes}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger">
              <ServerCrash size={20} />
            </div>
          </div>
          
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1 uppercase tracking-wider font-semibold">Global Latency</p>
              <h3 className="text-3xl font-bold text-white">{avgLatency} <span className="text-lg text-gray-500">ms</span></h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Activity size={20} />
            </div>
          </div>
        </div>

        {/* Live Grid */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-200">Live Services</h2>
          <div className="flex gap-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-success"></span> Online</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-danger"></span> Offline</span>
          </div>
        </div>
        
        {statusData.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
            {loading ? (
              <RefreshCw size={32} className="animate-spin text-gray-500 mb-4" />
            ) : (
              <ServerCrash size={32} className="text-gray-600 mb-4" />
            )}
            <p className="text-gray-400">{loading ? "Loading telemetry..." : "No targets found in status.json. Make sure the python monitor has run."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
            {statusData.map((item, index) => (
              <StatusCard key={index} item={item} />
            ))}
          </div>
        )}

        {/* Analytics Section */}
        <div className="mb-4 mt-8">
          <h2 className="text-xl font-semibold text-gray-200">Performance Analytics</h2>
        </div>
        <ReportChart historyData={historyData} />
        
      </div>
    </div>
  );
}
