import { useEffect, useState } from 'react';
import { getDB, InventoryItem } from '../utils/db';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const { user, addAuditLog } = useAuth();

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    itemId: '',
    equipmentName: '',
    category: 'Communication Device',
    serialNumber: '',
    quantity: 0,
    unit: 'pcs',
    status: 'Available',
    location: '',
    assignedUnit: '',
    dateAcquired: '',
    condition: 'Good',
    remarks: '',
  });

  const categories = [
    'Communication Device',
    'Radios',
    'Antennas',
    'Batteries',
    'Laptops',
    'Networking Equipment',
    'Power Supplies',
    'Tools',
    'Vehicles Accessories',
  ];

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [items, filterCategory, filterStatus]);

  const loadItems = async () => {
    const db = await getDB();
    const allItems = await db.getAll('items');
    setItems(allItems);
  };

  const applyFilters = () => {
    let filtered = [...items];
    if (filterCategory !== 'All') {
      filtered = filtered.filter((i) => i.category === filterCategory);
    }
    if (filterStatus !== 'All') {
      filtered = filtered.filter((i) => i.status === filterStatus);
    }
    setFilteredItems(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = await getDB();

    if (editingItem) {
      const updated: InventoryItem = {
        ...editingItem,
        ...formData,
        updatedAt: new Date().toISOString(),
      } as InventoryItem;
      await db.put('items', updated);
      await addAuditLog('Edit Item', `Updated item: ${updated.equipmentName}`, JSON.stringify(formData));
    } else {
      const newItem: InventoryItem = {
        id: `item-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as InventoryItem;
      await db.add('items', newItem);
      await addAuditLog('Add Item', `Added new item: ${newItem.equipmentName}`, JSON.stringify(newItem));
    }

    loadItems();
    closeModal();
  };

  const handleDelete = async (item: InventoryItem) => {
    if (user?.role === 'Viewer') {
      alert('You do not have permission to delete items');
      return;
    }
    if (!confirm(`Delete ${item.equipmentName}?`)) return;

    const db = await getDB();
    await db.delete('items', item.id);
    await addAuditLog('Delete Item', `Deleted item: ${item.equipmentName}`, item.id);
    loadItems();
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      itemId: '',
      equipmentName: '',
      category: 'Communication Device',
      serialNumber: '',
      quantity: 0,
      unit: 'pcs',
      status: 'Available',
      location: '',
      assignedUnit: '',
      dateAcquired: '',
      condition: 'Good',
      remarks: '',
    });
    setShowModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    if (user?.role === 'Viewer') {
      alert('You do not have permission to edit items');
      return;
    }
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-600';
      case 'Issued': return 'bg-yellow-600';
      case 'Damaged': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl text-white mb-2">Inventory Management</h1>
          <p className="text-slate-400">Manage equipment and supplies</p>
        </div>
        {user?.role !== 'Viewer' && (
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Item
          </button>
        )}
      </div>

      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Filter by Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded"
          >
            <option value="All">All Status</option>
            <option value="Available">Available</option>
            <option value="Issued">Issued</option>
            <option value="Damaged">Damaged</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Item ID</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Equipment Name</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Category</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Serial Number</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Quantity</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Location</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Condition</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-white">{item.itemId}</td>
                  <td className="px-4 py-3 text-white">{item.equipmentName}</td>
                  <td className="px-4 py-3 text-slate-300">{item.category}</td>
                  <td className="px-4 py-3 text-slate-300">{item.serialNumber}</td>
                  <td className="px-4 py-3 text-white">{item.quantity} {item.unit}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 ${getStatusColor(item.status)} text-white text-xs rounded`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{item.location}</td>
                  <td className="px-4 py-3 text-slate-300">{item.condition}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1 hover:bg-slate-600 rounded"
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </button>
                      {user?.role !== 'Viewer' && (
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1 hover:bg-slate-600 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl text-white">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button onClick={closeModal}>
                <X className="w-6 h-6 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Item ID *</label>
                  <input
                    type="text"
                    value={formData.itemId}
                    onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Equipment Name *</label>
                  <input
                    type="text"
                    value={formData.equipmentName}
                    onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Serial Number *</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Unit *</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                  >
                    <option value="Available">Available</option>
                    <option value="Issued">Issued</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Assigned Unit *</label>
                  <input
                    type="text"
                    value={formData.assignedUnit}
                    onChange={(e) => setFormData({ ...formData, assignedUnit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Date Acquired *</label>
                  <input
                    type="date"
                    value={formData.dateAcquired}
                    onChange={(e) => setFormData({ ...formData, dateAcquired: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Condition *</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                  >
                    <option value="Good">Good</option>
                    <option value="Repair Needed">Repair Needed</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-slate-300 mb-2">Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  {editingItem ? 'Update' : 'Add'} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
