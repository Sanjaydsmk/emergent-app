import React, { useState } from 'react';
import { useAuth, useDarkMode } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import { User, Lock, Moon, Sun } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Switch } from '../components/ui/switch';

export default function Settings() {
  const { API, user } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      toast.success('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl" data-testid="settings-page">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      {/* Profile Information */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.username}</h2>
            <p className="text-slate-400">{user?.role}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Username</label>
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <User className="w-5 h-5 text-slate-400" />
              <span className="text-white">{user?.username}</span>
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Role</label>
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-medium">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Current Password</label>
            <Input
              data-testid="current-password-input"
              type="password"
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-2 block">New Password</label>
            <Input
              data-testid="new-password-input"
              type="password"
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Confirm New Password</label>
            <Input
              data-testid="confirm-password-input"
              type="password"
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <Button
            data-testid="change-password-button"
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </form>
      </Card>

      {/* Appearance */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-3">
            {darkMode ? (
              <Moon className="w-5 h-5 text-slate-400" />
            ) : (
              <Sun className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <p className="text-white font-medium">Dark Mode</p>
              <p className="text-sm text-slate-400">Toggle dark/light theme</p>
            </div>
          </div>
          <Switch
            data-testid="dark-mode-toggle"
            checked={darkMode}
            onCheckedChange={toggleDarkMode}
          />
        </div>
      </Card>
    </div>
  );
}