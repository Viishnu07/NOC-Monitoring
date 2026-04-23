import React from 'react';
import { Server, Clock, Activity, AlertCircle, CheckCircle2, WifiOff, ShieldOff, Timer, Globe, HelpCircle } from 'lucide-react';

// Map errorType strings to icon + colour for DOWN states
const ERROR_META = {
  'HTTP 400':        { icon: HelpCircle,  color: 'text-orange-500', bg: 'bg-orange-50' },
  'HTTP 403':        { icon: ShieldOff,   color: 'text-red-500',    bg: 'bg-red-50'    },
  'HTTP 404':        { icon: Globe,       color: 'text-orange-500', bg: 'bg-orange-50' },
  'HTTP 500':        { icon: AlertCircle, color: 'text-red-600',    bg: 'bg-red-50'    },
  'HTTP 502':        { icon: AlertCircle, color: 'text-red-600',    bg: 'bg-red-50'    },
  'HTTP 503':        { icon: AlertCircle, color: 'text-red-600',    bg: 'bg-red-50'    },
  'HTTP 504':        { icon: AlertCircle, color: 'text-red-600',    bg: 'bg-red-50'    },
  'Timeout':         { icon: Timer,       color: 'text-amber-500',  bg: 'bg-amber-50'  },
  'Connection Error':{ icon: WifiOff,     color: 'text-red-500',    bg: 'bg-red-50'    },
  'Empty Response':  { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
  'Maintenance Page':{ icon: AlertCircle, color: 'text-amber-500',  bg: 'bg-amber-50'  },
  'ISP Redirect':    { icon: Globe,       color: 'text-purple-500', bg: 'bg-purple-50' },
  'Request Failed':  { icon: AlertCircle, color: 'text-red-500',    bg: 'bg-red-50'    },
  'No URL Defined':  { icon: HelpCircle,  color: 'text-slate-400',  bg: 'bg-slate-50'  },
};

function getErrorMeta(errorType) {
  if (!errorType) return ERROR_META['Request Failed'];
  // Handle generic "HTTP NNN" codes not explicitly listed
  if (errorType.startsWith('HTTP ')) {
    return ERROR_META[errorType] || { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' };
  }
  return ERROR_META[errorType] || { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' };
}

export default function StatusCard({ item }) {
  const isUp = item.status === 'UP';
  const isSlow = isUp && item.responseTime > 1000;
  const errorType = item.errorType || (isUp ? 'OK' : 'Unknown');
  const { icon: ErrorIcon, color: errorColor, bg: errorBg } = getErrorMeta(errorType);

  return (
    <div className={`bento-card bg-white p-6 relative overflow-hidden transition-all duration-200 border hover:shadow-md ${!isUp ? 'border-red-200' : (isSlow ? 'border-yellow-200' : 'border-slate-200')}`}>

      {/* Top indicator line */}
      <div className={`absolute top-0 left-0 w-full h-1 ${!isUp ? 'bg-danger' : (isSlow ? 'bg-yellow-500' : 'bg-transparent')}`}></div>

      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0 flex-1 pr-2">
          <h3 className="font-semibold text-lg text-slate-800 mb-1 flex items-center gap-2">
            <Server size={18} className="text-slate-400 shrink-0" />
            <span className="truncate">{item.name}</span>
          </h3>
          <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]" title={item.url || item.ip}>
            {item.url || item.ip}
          </p>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${!isUp ? 'bg-red-100 text-red-700' : (isSlow ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-100')}`}>
          {!isUp ? <AlertCircle size={14} /> : (isSlow ? <Clock size={14} /> : <CheckCircle2 size={14} />)}
          {!isUp ? 'DOWN' : (isSlow ? 'SLOW' : 'UP')}
        </div>
      </div>

      {/* Error / Status Type pill — shown for DOWN and special UP states */}
      {(!isUp || errorType === 'Auth Required') && (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium mb-3 ${errorBg} ${errorColor}`}>
          <ErrorIcon size={12} />
          {errorType}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-100">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Activity size={12} /> Response Time
          </span>
          <span className="text-sm font-semibold text-slate-800">
            {item.responseTime > 0 ? (
              <>{item.responseTime} <span className="text-xs text-slate-500 font-normal">ms</span></>
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Clock size={12} /> Last Checked
          </span>
          <span className="text-xs font-semibold text-slate-800 truncate" title={new Date(item.timestamp).toLocaleString()}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
