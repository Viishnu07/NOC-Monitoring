import React, { useRef, useState } from 'react';
import { Calendar, Download, Server } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReportChart from './ReportChart';

export default function ReportView({ historyData }) {
  const reportRef = useRef();
  const [reportType, setReportType] = useState('weekly');
  const [selectedPeriod, setSelectedPeriod] = useState('All');

  if (!historyData || historyData.length === 0) {
    return <div className="p-8 text-center text-gray-500">No historical data available for reporting.</div>;
  }

  // Helper to group by Week (formatting as Sunday - Saturday)
  const getWeekKey = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust to Sunday
    const sunday = new Date(d);
    sunday.setDate(diff);
    
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    
    const formatDate = (dt) => `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
    return `Week of ${formatDate(sunday)} - ${formatDate(saturday)}`;
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
          groups[gKey][node.name] = { up: 0, down: 0, totalLatency: 0, url: node.url || '', ip: node.ip || '', outages: [] };
        }
        if (node.status === 'UP') {
          groups[gKey][node.name].up += 1;
          groups[gKey][node.name].totalLatency += node.responseTime;
        } else {
          groups[gKey][node.name].down += 1;
          groups[gKey][node.name].outages.push({ timestamp: entry.timestamp });
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
          ip: stats.ip,
          uptimePercent: parseFloat(uptimePercent),
          downChecks: stats.down,
          avgLatency,
          outages: stats.outages
        };
      });
      return { period: gKey, nodes };
    });
  };

  const allGroups = processReportData();
  const availablePeriods = ['All', ...allGroups.map(g => g.period)];
  const reportGroups = selectedPeriod === 'All' 
    ? allGroups 
    : allGroups.filter(g => g.period === selectedPeriod);

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Document Title and Branding
    doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text("NOC Links Report", 14, 22);
    
    // Sub-header and metadata
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
    doc.text(`Timeframe: ${reportType === 'weekly' ? 'Weekly' : 'Monthly'} Report`, 14, 38);

    // Prepare Table Data
    const healthRows = [];
    const summaryRows = [];

    reportGroups.forEach(group => {
      group.nodes.forEach(item => {
        const totalDowntimeMins = item.downChecks * 5; // 5 minute intervals
        
        healthRows.push([
          `${item.name}\n${item.url}\nIP: ${item.ip}`,
          totalDowntimeMins === 0 ? '-' : `${totalDowntimeMins} mins`,
          `${item.uptimePercent.toFixed(2)}%`,
          `${Math.round(item.avgLatency)} ms`
        ]);

        if (item.downChecks > 0) {
          summaryRows.push([
            item.name,
            item.ip,
            `${item.downChecks} occurrences`
          ]);
        }
      });
    });

    let currentY = 50;

    // 1. Print Downtime Summary (If exists)
    if (summaryRows.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(20, 20, 20);
      doc.text("Downtime Connectivity Summary", 14, currentY);
      
      autoTable(doc, {
        head: [["Service Node", "IP Address", "Failed Ping Intervals (Occurrences)"]],
        body: summaryRows,
        startY: currentY + 4,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 4, font: 'helvetica' },
        headStyles: { fillColor: [100, 116, 139], textColor: 255, fontStyle: 'bold' } // Slate color
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
    }

    // 2. Print Main SLA Health Table
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text("Overall SLA Health & Latency", 14, currentY);

    autoTable(doc, {
      head: [["Endpoint / Routing Info", "Total Downtime", "Uptime %", "Avg Latency"]],
      body: healthRows,
      startY: currentY + 4,
      theme: 'grid',
      styles: { 
        fontSize: 10,
        cellPadding: 4,
        font: 'helvetica'
      },
      headStyles: { 
        fillColor: [30, 41, 59],
        textColor: 255, 
        fontStyle: 'bold' 
      },
      bodyStyles: {
        textColor: 50,
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 'auto', fontStyle: 'bold' },
        1: { cellWidth: 35 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 1) {
          if (data.cell.raw !== '-') data.cell.styles.textColor = [220, 38, 38]; // Red for downtime
        }
      }
    });

    // --- APPENDIX: DOWNTIME INCIDENTS ---
    const outageRows = [];
    reportGroups.forEach(group => {
      group.nodes.forEach(item => {
        if (item.outages && item.outages.length > 0) {
           item.outages.forEach(outage => {
              const ts = new Date(outage.timestamp).toLocaleString();
              outageRows.push([
                item.name,
                item.url,
                ts
              ]);
           });
        }
      });
    });

    if (outageRows.length > 0) {
      currentY = doc.lastAutoTable.finalY + 20;
      
      // Auto-paginate if too close to bottom margin
      if (currentY > 250) {
         doc.addPage();
         currentY = 22;
      }

      doc.setFontSize(16);
      doc.setTextColor(20, 20, 20);
      doc.text("Appendix A: Outage Timestamps", 14, currentY);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Detailed log of exact downtime occurences recorded by the NOC Bot.", 14, currentY + 6);
      
      autoTable(doc, {
        head: [["Service Node", "URL", "Incident Timestamp (Local Time)"]],
        body: outageRows,
        startY: currentY + 13,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38] }, // Red header for outages
      });
    }

    // Add Pagination Footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}  |  Confidential NOC Report`, 
        doc.internal.pageSize.width / 2, 
        doc.internal.pageSize.height - 10, 
        { align: 'center' }
      );
    }

    doc.save(`NOC-Links-Report-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`);
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
             onChange={(e) => { setReportType(e.target.value); setSelectedPeriod('All'); }}
             className="bg-card text-white border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
           >
             <option value="weekly">Weekly Report</option>
             <option value="monthly">Monthly Report</option>
           </select>

           <select 
             value={selectedPeriod} 
             onChange={(e) => setSelectedPeriod(e.target.value)}
             className="bg-card text-white border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
           >
             {availablePeriods.map(period => (
               <option key={period} value={period}>{period === 'All' ? 'All Periods' : period}</option>
             ))}
           </select>
           
           <button 
             onClick={exportPDF}
             className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg"
           >
             <Download size={16} /> Export to PDF
           </button>
        </div>
      </div>
      
      {/* Visual Chart for the Report */}
      <div className="report-view-chart mb-8 px-4 md:px-0">
         <ReportChart historyData={historyData} />
      </div>

      {reportGroups.length === 0 ? (
        <div className="bento-card p-12 text-center text-gray-500">Not enough data to calculate periods.</div>
      ) : (
        <div className="space-y-10 px-4 md:px-0">
          {reportGroups.map((group) => (
            <div key={group.period} className="bento-card overflow-hidden">
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
                      <th className="px-6 py-4 font-semibold">Total Downtime</th>
                      <th className="px-6 py-4 font-semibold">Uptime %</th>
                      <th className="px-6 py-4 font-semibold">Avg Latency</th>
                      <th className="px-6 py-4 font-semibold text-right">Failure Events</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {group.nodes.map((node, i) => {
                      const downtimeMins = node.downChecks * 5;
                      return (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Server size={16} className="text-gray-500" />
                            <div>
                              <div className="font-medium text-gray-200">{node.name}</div>
                              <div className="text-xs text-gray-500">{node.url}</div>
                              {node.ip && <div className="text-[10px] text-gray-600 font-mono mt-0.5">IP: {node.ip}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`font-semibold ${downtimeMins > 0 ? 'text-danger' : 'text-gray-500'}`}>
                            {downtimeMins === 0 ? '-' : `${downtimeMins} mins`}
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
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${node.downChecks === 0 ? 'bg-success/10 text-success' : 'bg-danger/20 text-danger'}`}>
                            {node.downChecks} occurrences
                          </span>
                        </td>
                      </tr>
                      );
                    })}
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
