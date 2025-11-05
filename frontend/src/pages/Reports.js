import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import { Card } from '../components/ui/card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Reports() {
  const { API } = useAuth();
  const [deptSpending, setDeptSpending] = useState([]);
  const [monthlyPurchases, setMonthlyPurchases] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const [deptRes, monthlyRes, statsRes] = await Promise.all([
        axios.get(`${API}/reports/department-spending`),
        axios.get(`${API}/reports/monthly-purchases`),
        axios.get(`${API}/reports/dashboard`),
      ]);
      setDeptSpending(deptRes.data);
      setMonthlyPurchases(monthlyRes.data);
      setDashboardStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#cbd5e1',
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' },
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' },
      },
    },
  };

  // Department Spending Chart
  const deptChartData = {
    labels: deptSpending.map(d => d.dept_name),
    datasets: [
      {
        label: 'Budget',
        data: deptSpending.map(d => d.budget),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Spending',
        data: deptSpending.map(d => d.spending),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Monthly Purchases Chart
  const monthlyChartData = {
    labels: monthlyPurchases.map(m => m.month),
    datasets: [
      {
        label: 'Monthly Spending',
        data: monthlyPurchases.map(m => m.spending),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Budget vs Spending Doughnut
  const budgetChartData = {
    labels: ['Spent', 'Remaining'],
    datasets: [
      {
        data: [
          dashboardStats?.total_spending || 0,
          (dashboardStats?.total_budget || 0) - (dashboardStats?.total_spending || 0),
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.5)',
          'rgba(71, 85, 105, 0.5)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(71, 85, 105, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return <div className="text-white">Loading reports...</div>;
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
        <p className="text-slate-400">Visual insights into spending and inventory</p>
      </div>

      {/* Department Spending */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Department Budget vs Spending</h3>
        <div className="chart-container" data-testid="department-spending-chart">
          <Bar data={deptChartData} options={chartOptions} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card className="bg-slate-900 border-slate-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Monthly Purchase Trends</h3>
          <div className="chart-container" data-testid="monthly-trends-chart">
            <Line data={monthlyChartData} options={chartOptions} />
          </div>
        </Card>

        {/* Budget Overview */}
        <Card className="bg-slate-900 border-slate-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Budget Overview</h3>
          <div className="chart-container" data-testid="budget-overview-chart">
            <Doughnut
              data={budgetChartData}
              options={{
                ...chartOptions,
                scales: undefined,
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Budget:</span>
              <span className="text-white font-semibold">
                ${dashboardStats?.total_budget?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Spent:</span>
              <span className="text-emerald-400 font-semibold">
                ${dashboardStats?.total_spending?.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {dashboardStats?.low_stock_items && dashboardStats.low_stock_items.length > 0 && (
        <Card className="bg-slate-900 border-slate-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Low Stock Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardStats.low_stock_items.map((item) => (
              <div
                key={item.item_id}
                className="p-4 bg-amber-900/20 border border-amber-800 rounded-lg"
                data-testid={`low-stock-alert-${item.item_name}`}
              >
                <p className="text-white font-medium mb-1">{item.item_name}</p>
                <p className="text-amber-400 text-sm">Only {item.quantity} remaining</p>
                <p className="text-slate-400 text-xs mt-1">{item.category}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}