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

export default function Suppliers() {
  const { API, user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    supplier_name: '',
    contact: '',
    email: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API}/suppliers`);
      setSuppliers(response.data);
    } catch (error) {
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await axios.put(`${API}/suppliers/${editingSupplier.supplier_id}`, formData);
        toast.success('Supplier updated successfully');
      } else {
        await axios.post(`${API}/suppliers`, formData);
        toast.success('Supplier created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await axios.delete(`${API}/suppliers/${supplierId}`);
      toast.success('Supplier deleted successfully');
      fetchSuppliers();
    } catch (error) {
      toast.error('Failed to delete supplier');
    }
  };

  const openEditDialog = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      supplier_name: supplier.supplier_name,
      contact: supplier.contact,
      email: supplier.email,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ supplier_name: '', contact: '', email: '' });
    setEditingSupplier(null);
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-6" data-testid="suppliers-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Suppliers</h1>
          <p className="text-slate-400">Manage supplier information and contacts</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-supplier-button"
                onClick={resetForm}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Supplier Name</label>
                  <Input
                    data-testid="supplier-name-input"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Contact</label>
                  <Input
                    data-testid="supplier-contact-input"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Email</label>
                  <Input
                    data-testid="supplier-email-input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    data-testid="save-supplier-button"
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {editingSupplier ? 'Update' : 'Create'}
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
              <TableHead className="text-slate-300">Supplier Name</TableHead>
              <TableHead className="text-slate-300">Contact</TableHead>
              <TableHead className="text-slate-300">Email</TableHead>
              {isAdmin && <TableHead className="text-slate-300 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow
                key={supplier.supplier_id}
                data-testid={`supplier-row-${supplier.supplier_name}`}
                className="border-slate-800 hover:bg-slate-800/50"
              >
                <TableCell className="text-white font-medium">{supplier.supplier_name}</TableCell>
                <TableCell className="text-slate-300">{supplier.contact}</TableCell>
                <TableCell className="text-slate-300">{supplier.email}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        data-testid={`edit-supplier-${supplier.supplier_name}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(supplier)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        data-testid={`delete-supplier-${supplier.supplier_name}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(supplier.supplier_id)}
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