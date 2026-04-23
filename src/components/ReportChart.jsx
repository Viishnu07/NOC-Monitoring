import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ReportChart({ historyData }) {
  if (!historyData || historyData.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-card rounded-[1.5rem] border border-border">
        No historical data available yet.
      </div>
    );
  }

  const labels = historyData.map(entry => {
    const d = new Date(entry.timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  const getAvgLatency = (entry) => {
    const upNodes = entry.results.filter(r => r.status === 'UP');
    if (upNodes.length === 0) return 0;
    const sum = upNodes.reduce((acc, curr) => acc + curr.responseTime, 0);
    return sum / upNodes.length;
  };

  const latencyData = historyData.map(entry => getAvgLatency(entry));
  
  const getUptimePercent = (entry) => {
    const total = entry.results.length;
    const up = entry.results.filter(r => r.status === 'UP').length;
    return total > 0 ? (up / total) * 100 : 0;
  };
  
  const uptimeData = historyData.map(entry => getUptimePercent(entry));

  const latencyChartData = {
    labels,
    datasets: [
      {
        label: 'Avg Latency (ms)',
        data: latencyData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHitRadius: 10,
      }
    ]
  };

  const uptimeChartData = {
    labels,
    datasets: [
      {
        label: 'Network Uptime (%)',
        data: uptimeData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHitRadius: 10,
      }
    ]
  };

  // Dark-mode chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',   // card
        titleColor: '#f1f5f9',        // slate-100
        bodyColor: '#94a3b8',         // slate-400
        borderColor: '#334155',       // border
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
      }
    },
    scales: {
      x: {
        grid: { color: '#1e293b', drawBorder: false },
        ticks: { color: '#475569', maxTicksLimit: 8 }  // slate-600
      },
      y: {
        beginAtZero: true,
        grid: { color: '#1e2d40', drawBorder: false },
        ticks: { color: '#475569' }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-[1.5rem] p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-100 tracking-tight">Network Uptime</h3>
          <p className="text-xs text-slate-500 mt-1">System availability over time (%)</p>
        </div>
        <div className="h-64 w-full">
          <Line data={uptimeChartData} options={{...chartOptions, scales: {...chartOptions.scales, y: {...chartOptions.scales.y, max: 105}}}} />
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-[1.5rem] p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-100 tracking-tight">Average Latency</h3>
          <p className="text-xs text-slate-500 mt-1">Response time trends across all nodes (ms)</p>
        </div>
        <div className="h-64 w-full">
          <Line data={latencyChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
