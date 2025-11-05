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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

export default function Items() {
  const { API, user } = useAuth();
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    quantity: '',
    cost: '',
    dept_id: '',
  });

  useEffect(() => {
    fetchItems();
    fetchDepartments();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API}/items`);
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        item_name: formData.item_name,
        category: formData.category,
        quantity: parseInt(formData.quantity),
        cost: parseFloat(formData.cost),
        dept_id: formData.dept_id,
      };

      if (editingItem) {
        await axios.put(`${API}/items/${editingItem.item_id}`, payload);
        toast.success('Item updated successfully');
      } else {
        await axios.post(`${API}/items`, payload);
        toast.success('Item created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`${API}/items/${itemId}`);
      toast.success('Item deleted successfully');
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      category: item.category,
      quantity: item.quantity.toString(),
      cost: item.cost.toString(),
      dept_id: item.dept_id,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ item_name: '', category: '', quantity: '', cost: '', dept_id: '' });
    setEditingItem(null);
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.dept_id === deptId);
    return dept ? dept.dept_name : 'Unknown';
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-6" data-testid="items-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Items</h1>
          <p className="text-slate-400">Manage inventory items and stock levels</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-item-button"
                onClick={resetForm}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingItem ? 'Edit Item' : 'Add Item'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Item Name</label>
                  <Input
                    data-testid="item-name-input"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Category</label>
                  <Input
                    data-testid="item-category-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Quantity</label>
                  <Input
                    data-testid="item-quantity-input"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Cost</label>
                  <Input
                    data-testid="item-cost-input"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Department</label>
                  <Select
                    value={formData.dept_id}
                    onValueChange={(value) => setFormData({ ...formData, dept_id: value })}
                  >
                    <SelectTrigger
                      data-testid="item-dept-select"
                      className="bg-slate-800 border-slate-700 text-white"
                    >
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {departments.map((dept) => (
                        <SelectItem
                          key={dept.dept_id}
                          value={dept.dept_id}
                          className="text-white"
                        >
                          {dept.dept_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    data-testid="save-item-button"
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {editingItem ? 'Update' : 'Create'}
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
              <TableHead className="text-slate-300">Item Name</TableHead>
              <TableHead className="text-slate-300">Category</TableHead>
              <TableHead className="text-slate-300">Quantity</TableHead>
              <TableHead className="text-slate-300">Cost</TableHead>
              <TableHead className="text-slate-300">Department</TableHead>
              {isAdmin && <TableHead className="text-slate-300 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.item_id}
                data-testid={`item-row-${item.item_name}`}
                className="border-slate-800 hover:bg-slate-800/50"
              >
                <TableCell className="text-white font-medium">{item.item_name}</TableCell>
                <TableCell className="text-slate-300">{item.category}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-medium ${
                      item.quantity < 10
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {item.quantity}
                  </span>
                </TableCell>
                <TableCell className="text-slate-300">${item.cost.toFixed(2)}</TableCell>
                <TableCell className="text-slate-300">{getDepartmentName(item.dept_id)}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        data-testid={`edit-item-${item.item_name}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(item)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        data-testid={`delete-item-${item.item_name}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.item_id)}
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