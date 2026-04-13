import React from 'react';
import { Server, Clock, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function StatusCard({ item }) {
  const isUp = item.status === 'UP';
  
  return (
    <div className={`bento-card p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${!isUp ? 'border-danger/40 hover:border-danger' : (item.responseTime > 1000 ? 'border-yellow-500/40 hover:border-yellow-500' : 'border-transparent hover:border-border')}`}>
      
      {/* Subtle top indicator line instead of giant blur blob */}
      <div className={`absolute top-0 left-0 w-full h-1 ${!isUp ? 'bg-danger' : (item.responseTime > 1000 ? 'bg-yellow-500' : 'bg-transparent')}`}></div>
      
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
        
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${!isUp ? 'bg-danger/20 text-danger animate-pulse' : (item.responseTime > 1000 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-success/10 text-success')}`}>
          {!isUp ? <AlertCircle size={14} /> : (item.responseTime > 1000 ? <Clock size={14} /> : <CheckCircle2 size={14} />)}
          {!isUp ? 'DOWN' : (item.responseTime > 1000 ? 'SLOW' : 'UP')}
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
