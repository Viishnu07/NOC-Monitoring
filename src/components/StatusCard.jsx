import React from 'react';
import { Server, Clock, Activity, AlertCircle, CheckCircle2, WifiOff, ShieldOff, Timer, Globe, HelpCircle } from 'lucide-react';

// Map errorType strings to icon + colour for DOWN states
const ERROR_META = {
  'HTTP 400':         { icon: HelpCircle,  color: 'text-orange-400', bg: 'bg-orange-900/30' },
  'HTTP 403':         { icon: ShieldOff,   color: 'text-red-400',    bg: 'bg-red-900/30'    },
  'HTTP 404':         { icon: Globe,       color: 'text-orange-400', bg: 'bg-orange-900/30' },
  'HTTP 500':         { icon: AlertCircle, color: 'text-red-400',    bg: 'bg-red-900/30'    },
  'HTTP 502':         { icon: AlertCircle, color: 'text-red-400',    bg: 'bg-red-900/30'    },
  'HTTP 503':         { icon: AlertCircle, color: 'text-red-400',    bg: 'bg-red-900/30'    },
  'HTTP 504':         { icon: AlertCircle, color: 'text-red-400',    bg: 'bg-red-900/30'    },
  'Timeout':          { icon: Timer,       color: 'text-amber-400',  bg: 'bg-amber-900/30'  },
  'Connection Error': { icon: WifiOff,     color: 'text-red-400',    bg: 'bg-red-900/30'    },
  'Empty Response':   { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-900/30' },
  'Maintenance Page': { icon: AlertCircle, color: 'text-amber-400',  bg: 'bg-amber-900/30'  },
  'ISP Redirect':     { icon: Globe,       color: 'text-purple-400', bg: 'bg-purple-900/30' },
  'Request Failed':   { icon: AlertCircle, color: 'text-red-400',    bg: 'bg-red-900/30'    },
  'No URL Defined':   { icon: HelpCircle,  color: 'text-slate-400',  bg: 'bg-slate-700/30'  },
};

function getErrorMeta(errorType) {
  if (!errorType) return ERROR_META['Request Failed'];
  if (errorType.startsWith('HTTP ')) {
    return ERROR_META[errorType] || { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-900/30' };
  }
  return ERROR_META[errorType] || { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-900/30' };
}

export default function StatusCard({ item }) {
  const isUp = item.status === 'UP';
  const isSlow = isUp && item.responseTime > 1000;
  const errorType = item.errorType || (isUp ? 'OK' : 'Unknown');
  const { icon: ErrorIcon, color: errorColor, bg: errorBg } = getErrorMeta(errorType);

  return (
    <div className={`bento-card p-6 relative overflow-hidden transition-all duration-200 hover:shadow-md ${
      !isUp ? 'border-red-900/60' : (isSlow ? 'border-yellow-900/60' : 'border-border')
    }`}>

      {/* Top indicator line */}
      <div className={`absolute top-0 left-0 w-full h-1 ${!isUp ? 'bg-danger' : (isSlow ? 'bg-yellow-400' : 'bg-transparent')}`}></div>

      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0 flex-1 pr-2">
          <h3 className="font-semibold text-lg text-slate-100 mb-1 flex items-center gap-2">
            <Server size={18} className="text-slate-500 shrink-0" />
            <span className="truncate">{item.name}</span>
          </h3>
          <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]" title={item.url || item.ip}>
            {item.url || item.ip}
          </p>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
          !isUp
            ? 'bg-red-900/40 text-red-400'
            : (isSlow ? 'bg-yellow-900/40 text-yellow-400' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50')
        }`}>
          {!isUp ? <AlertCircle size={14} /> : (isSlow ? <Clock size={14} /> : <CheckCircle2 size={14} />)}
          {!isUp ? 'DOWN' : (isSlow ? 'SLOW' : 'UP')}
        </div>
      </div>

      {/* Error / Status type pill — shown for DOWN and auth-gated UP */}
      {(!isUp || errorType === 'Auth Required') && (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium mb-3 ${errorBg} ${errorColor}`}>
          <ErrorIcon size={12} />
          {errorType}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-border/50">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Activity size={12} /> Response Time
          </span>
          <span className="text-sm font-semibold text-slate-200">
            {item.responseTime > 0 ? (
              <>{item.responseTime} <span className="text-xs text-slate-500 font-normal">ms</span></>
            ) : (
              <span className="text-slate-600">—</span>
            )}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Clock size={12} /> Last Checked
          </span>
          <span className="text-xs font-semibold text-slate-200 truncate" title={new Date(item.timestamp).toLocaleString()}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
