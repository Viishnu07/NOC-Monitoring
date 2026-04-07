import React, { useRef, useState } from 'react';
import { Calendar, Download, Server, AlertTriangle, CheckCircle2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export default function ReportView({ historyData }) {
  const reportRef = useRef();
  const [reportType, setReportType] = useState('weekly');

  if (!historyData || historyData.length === 0) {
    return <div className="p-8 text-center text-gray-500">No historical data available for reporting.</div>;
  }

  // Helper to group by Week (simplistic: Year-Week based on timestamp)
  const getWeekKey = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
  };

  // Helper to group by Month
  const getMonthKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  // Process data out of history
  const processReportData = () => {
    const groups = {}; // { groupKey: { nodeName: { up: 0, down: 0, totalLatency: 0 } } }
    
    historyData.forEach(entry => {
      const gKey = reportType === 'weekly' ? getWeekKey(entry.timestamp) : getMonthKey(entry.timestamp);
      
      if (!groups[gKey]) {
        groups[gKey] = {};
      }
      
      entry.results.forEach(node => {
        if (!groups[gKey][node.name]) {
          groups[gKey][node.name] = { up: 0, down: 0, totalLatency: 0, url: node.url || node.ip };
        }
        if (node.status === 'UP') {
          groups[gKey][node.name].up += 1;
          groups[gKey][node.name].totalLatency += node.responseTime;
        } else {
          groups[gKey][node.name].down += 1;
        }
      });
    });

    // Format for display
    return Object.keys(groups).sort((a,b) => b.localeCompare(a)).map(gKey => {
      const nodes = Object.keys(groups[gKey]).map(nodeName => {
        const stats = groups[gKey][nodeName];
        const totalChecks = stats.up + stats.down;
        const uptimePercent = totalChecks > 0 ? ((stats.up / totalChecks) * 100).toFixed(2) : 0;
        const avgLatency = stats.up > 0 ? Math.round(stats.totalLatency / stats.up) : 0;
        
        return {
          name: nodeName,
          url: stats.url,
          uptimePercent: parseFloat(uptimePercent),
          downChecks: stats.down,
          avgLatency
        };
      });
      return { period: gKey, nodes };
    });
  };

  const reportGroups = processReportData();

  const exportPDF = () => {
    const element = reportRef.current;
    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     `NOC_${reportType.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#0B0F19' },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    element.classList.add('pdf-export-mode');
    html2pdf().set(opt).from(element).save().then(() => {
       element.classList.remove('pdf-export-mode');
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 relative z-10 w-full" ref={reportRef}>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400 tracking-tight flex items-center gap-3">
            <Calendar size={28} className="text-blue-500" /> Compliance Reports
          </h1>
          <p className="text-gray-400 text-sm mt-1">Aggregated historical uptime tracking</p>
        </div>
        
        <div className="flex gap-3 items-center" data-html2canvas-ignore>
           <select 
             value={reportType} 
             onChange={(e) => setReportType(e.target.value)}
             className="bg-card text-white border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
           >
             <option value="weekly">Weekly Report</option>
             <option value="monthly">Monthly Report</option>
           </select>
           
           <button 
             onClick={exportPDF}
             className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg"
           >
             <Download size={16} /> Export to PDF
           </button>
        </div>
      </div>

      {reportGroups.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-500">Not enough data to calculate periods.</div>
      ) : (
        <div className="space-y-10 px-4 md:px-0">
          {reportGroups.map((group) => (
            <div key={group.period} className="glass-card overflow-hidden">
              <div className="bg-border/50 px-6 py-4 border-b border-border">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                  Period: {group.period}
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-card/50 text-xs uppercase tracking-wider text-gray-400 border-b border-border">
                      <th className="px-6 py-4 font-semibold">Service Node</th>
                      <th className="px-6 py-4 font-semibold">Uptime %</th>
                      <th className="px-6 py-4 font-semibold">Avg Latency</th>
                      <th className="px-6 py-4 font-semibold">Downtime Events</th>
                      <th className="px-6 py-4 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {group.nodes.map((node, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Server size={16} className="text-gray-500" />
                            <div>
                              <div className="font-medium text-gray-200">{node.name}</div>
                              <div className="text-xs text-gray-500">{node.url}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${node.uptimePercent >= 99 ? 'text-success' : (node.uptimePercent >= 95 ? 'text-yellow-500' : 'text-danger')}`}>
                            {node.uptimePercent}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {node.avgLatency} <span className="text-xs text-gray-500">ms</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${node.downChecks === 0 ? 'bg-success/10 text-success' : 'bg-danger/20 text-danger'}`}>
                            {node.downChecks} interval(s)
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {node.uptimePercent >= 99 ? (
                            <div className="flex items-center justify-end gap-1.5 text-success text-sm font-medium">
                              <CheckCircle2 size={16} /> Healthy
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5 text-danger text-sm font-medium">
                              <AlertTriangle size={16} /> SLA Risk
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
