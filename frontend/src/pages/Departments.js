import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

export default function Departments() {
  const { API, user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    dept_name: '',
    budget: '',
    head_name: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(response.data);
    } catch (error) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await axios.put(`${API}/departments/${editingDept.dept_id}`, {
          dept_name: formData.dept_name,
          budget: parseFloat(formData.budget),
          head_name: formData.head_name,
        });
        toast.success('Department updated successfully');
      } else {
        await axios.post(`${API}/departments`, {
          dept_name: formData.dept_name,
          budget: parseFloat(formData.budget),
          head_name: formData.head_name,
        });
        toast.success('Department created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (deptId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await axios.delete(`${API}/departments/${deptId}`);
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (error) {
      toast.error('Failed to delete department');
    }
  };

  const openEditDialog = (dept) => {
    setEditingDept(dept);
    setFormData({
      dept_name: dept.dept_name,
      budget: dept.budget.toString(),
      head_name: dept.head_name,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ dept_name: '', budget: '', head_name: '' });
    setEditingDept(null);
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-6" data-testid="departments-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Departments</h1>
          <p className="text-slate-400">Manage department information and budgets</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-department-button"
                onClick={resetForm}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingDept ? 'Edit Department' : 'Add Department'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Department Name</label>
                  <Input
                    data-testid="dept-name-input"
                    value={formData.dept_name}
                    onChange={(e) => setFormData({ ...formData, dept_name: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Budget</label>
                  <Input
                    data-testid="dept-budget-input"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Head Name</label>
                  <Input
                    data-testid="dept-head-input"
                    value={formData.head_name}
                    onChange={(e) => setFormData({ ...formData, head_name: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="flex-1 border-slate-700 text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    data-testid="save-department-button"
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {editingDept ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-slate-800/50">
              <TableHead className="text-slate-300">Department Name</TableHead>
              <TableHead className="text-slate-300">Budget</TableHead>
              <TableHead className="text-slate-300">Head Name</TableHead>
              {isAdmin && <TableHead className="text-slate-300 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow
                key={dept.dept_id}
                data-testid={`department-row-${dept.dept_name}`}
                className="border-slate-800 hover:bg-slate-800/50"
              >
                <TableCell className="text-white font-medium">{dept.dept_name}</TableCell>
                <TableCell className="text-emerald-400">
                  ${dept.budget.toLocaleString()}
                </TableCell>
                <TableCell className="text-slate-300">{dept.head_name}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        data-testid={`edit-dept-${dept.dept_name}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(dept)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        data-testid={`delete-dept-${dept.dept_name}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(dept.dept_id)}
                        className="text-red-400 hover:text-red-300 hover:bg-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}