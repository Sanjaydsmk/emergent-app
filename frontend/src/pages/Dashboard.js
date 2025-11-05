import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { Package, Building2, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/card';

export default function Dashboard() {
  const { API } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/reports/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Items',
      value: stats?.total_items || 0,
      icon: Package,
      color: 'emerald',
      testId: 'total-items-card'
    },
    {
      title: 'Departments',
      value: stats?.total_departments || 0,
      icon: Building2,
      color: 'blue',
      testId: 'total-departments-card'
    },
    {
      title: 'Suppliers',
      value: stats?.total_suppliers || 0,
      icon: Users,
      color: 'purple',
      testId: 'total-suppliers-card'
    },
    {
      title: 'Total Budget',
      value: `$${stats?.total_budget?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'amber',
      testId: 'total-budget-card'
    },
  ];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Overview of your inventory system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              data-testid={stat.testId}
              className="bg-slate-900 border-slate-800 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Low Stock Alert */}
      {stats?.low_stock_count > 0 && (
        <Card className="bg-amber-900/20 border-amber-800 p-6" data-testid="low-stock-alert">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Low Stock Alert
              </h3>
              <p className="text-slate-300 mb-4">
                {stats.low_stock_count} items are running low on stock (quantity &lt; 10)
              </p>
              <div className="space-y-2">
                {stats.low_stock_items?.slice(0, 5).map((item) => (
                  <div
                    key={item.item_id}
                    className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg"
                    data-testid={`low-stock-item-${item.item_name}`}
                  >
                    <span className="text-white font-medium">{item.item_name}</span>
                    <span className="text-amber-400 font-semibold">
                      Only {item.quantity} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Spending Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Budget</span>
              <span className="text-white font-semibold">
                ${stats?.total_budget?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Spending</span>
              <span className="text-emerald-400 font-semibold">
                ${stats?.total_spending?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-slate-400">Remaining</span>
              <span className="text-white font-bold text-lg">
                ${((stats?.total_budget || 0) - (stats?.total_spending || 0)).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300">Active Departments</span>
              <span className="text-emerald-400 font-semibold">{stats?.total_departments || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300">Registered Suppliers</span>
              <span className="text-emerald-400 font-semibold">{stats?.total_suppliers || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300">Items in Stock</span>
              <span className="text-emerald-400 font-semibold">{stats?.total_items || 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}