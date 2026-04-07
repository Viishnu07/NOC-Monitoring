import React from 'react';
import { Server, Clock, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function StatusCard({ item }) {
  const isUp = item.status === 'UP';
  
  return (
    <div className={`glass-card p-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${isUp ? 'border-success/20 hover:border-success/50' : 'border-danger/40 hover:border-danger/80'}`}>
      
      {/* Background glow effect based on status */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${isUp ? 'bg-success' : 'bg-danger animate-pulse-slow'}`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-white mb-1 flex items-center gap-2">
            <Server size={18} className="text-gray-400" />
            {item.name}
          </h3>
          <p className="text-xs text-gray-400 font-mono truncate max-w-[200px]" title={item.url || item.ip}>
            {item.url || item.ip}
          </p>
        </div>
        
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isUp ? 'bg-success/10 text-success' : 'bg-danger/20 text-danger animate-pulse'}`}>
          {isUp ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {item.status}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Activity size={12} /> Response Time
          </span>
          <span className="text-sm font-medium text-gray-300">
            {item.responseTime} <span className="text-xs text-gray-500">ms</span>
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Clock size={12} /> Last Checked
          </span>
          <span className="text-xs font-medium text-gray-300 truncate" title={new Date(item.timestamp).toLocaleString()}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
