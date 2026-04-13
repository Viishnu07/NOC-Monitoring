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
    return <div className="p-8 text-center text-gray-500">No historical data available yet.</div>;
  }

  // Optimize data: if we have lots of points, maybe downsample in production, but we'll show them.
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
        borderColor: 'rgb(56, 189, 248)', // Tailwind sky-400 (matches new accent)
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
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
        borderColor: 'rgb(52, 211, 153)', // Tailwind emerald-400 (matches new success)
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHitRadius: 10,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          maxTicksLimit: 8
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b'
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bento-card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-white tracking-wide">Network Uptime</h3>
          <p className="text-xs text-gray-400 mt-1">System availability over time (%)</p>
        </div>
        <div className="h-64 w-full">
          <Line data={uptimeChartData} options={{...chartOptions, scales: {...chartOptions.scales, y: {...chartOptions.scales.y, max: 105}}}} />
        </div>
      </div>
      
      <div className="bento-card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-white tracking-wide">Average Latency</h3>
          <p className="text-xs text-gray-400 mt-1">Response time trends across all nodes (ms)</p>
        </div>
        <div className="h-64 w-full">
          <Line data={latencyChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
