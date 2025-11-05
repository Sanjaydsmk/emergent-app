import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
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
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

export default function Purchases() {
  const { API, user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    item_id: '',
    supplier_id: '',
    quantity: '',
  });

  useEffect(() => {
    fetchPurchases();
    fetchItems();
    fetchSuppliers();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await axios.get(`${API}/purchases`);
      setPurchases(response.data);
    } catch (error) {
      toast.error('Failed to fetch purchases');
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API}/items`);
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API}/suppliers`);
      setSuppliers(response.data);
    } catch (error) {
      console.error('Failed to fetch suppliers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/purchases`, {
        item_id: formData.item_id,
        supplier_id: formData.supplier_id,
        quantity: parseInt(formData.quantity),
      });
      toast.success('Purchase created successfully');
      setDialogOpen(false);
      resetForm();
      fetchPurchases();
      fetchItems(); // Refresh items to show updated quantities
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({ item_id: '', supplier_id: '', quantity: '' });
  };

  const getItemName = (itemId) => {
    const item = items.find(i => i.item_id === itemId);
    return item ? item.item_name : 'Unknown';
  };

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.supplier_id === supplierId);
    return supplier ? supplier.supplier_name : 'Unknown';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-6" data-testid="purchases-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Purchases</h1>
          <p className="text-slate-400">Record and track purchase transactions</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-purchase-button"
                onClick={resetForm}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">Record New Purchase</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Item</label>
                  <Select
                    value={formData.item_id}
                    onValueChange={(value) => setFormData({ ...formData, item_id: value })}
                  >
                    <SelectTrigger
                      data-testid="purchase-item-select"
                      className="bg-slate-800 border-slate-700 text-white"
                    >
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {items.map((item) => (
                        <SelectItem
                          key={item.item_id}
                          value={item.item_id}
                          className="text-white"
                        >
                          {item.item_name} (${item.cost})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Supplier</label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  >
                    <SelectTrigger
                      data-testid="purchase-supplier-select"
                      className="bg-slate-800 border-slate-700 text-white"
                    >
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {suppliers.map((supplier) => (
                        <SelectItem
                          key={supplier.supplier_id}
                          value={supplier.supplier_id}
                          className="text-white"
                        >
                          {supplier.supplier_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Quantity</label>
                  <Input
                    data-testid="purchase-quantity-input"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    min="1"
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
                    data-testid="save-purchase-button"
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Record Purchase
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
              <TableHead className="text-slate-300">Item</TableHead>
              <TableHead className="text-slate-300">Supplier</TableHead>
              <TableHead className="text-slate-300">Quantity</TableHead>
              <TableHead className="text-slate-300">Total Cost</TableHead>
              <TableHead className="text-slate-300">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow
                key={purchase.purchase_id}
                data-testid={`purchase-row-${purchase.purchase_id}`}
                className="border-slate-800 hover:bg-slate-800/50"
              >
                <TableCell className="text-white font-medium">
                  {getItemName(purchase.item_id)}
                </TableCell>
                <TableCell className="text-slate-300">
                  {getSupplierName(purchase.supplier_id)}
                </TableCell>
                <TableCell className="text-slate-300">{purchase.quantity}</TableCell>
                <TableCell className="text-emerald-400 font-semibold">
                  ${purchase.total_cost.toLocaleString()}
                </TableCell>
                <TableCell className="text-slate-400 text-sm">
                  {formatDate(purchase.date)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}