import { useEffect, useState } from 'react';
import { getDB, InventoryItem } from '../utils/db';
import { Search as SearchIcon, Filter } from 'lucide-react';

export function Search() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('equipmentName');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

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
  }, [items, searchTerm, searchBy, filterCategory, filterStatus]);

  const loadItems = async () => {
    const db = await getDB();
    const allItems = await db.getAll('items');
    setItems(allItems);
  };

  const applyFilters = () => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const value = item[searchBy as keyof InventoryItem];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    }

    if (filterCategory !== 'All') {
      filtered = filtered.filter((i) => i.category === filterCategory);
    }

    if (filterStatus !== 'All') {
      filtered = filtered.filter((i) => i.status === filterStatus);
    }

    setFilteredItems(filtered);
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
      <div className="mb-8">
        <h1 className="text-3xl text-white mb-2">Search & Filter</h1>
        <p className="text-slate-400">Find equipment quickly</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-300 mb-2">Search Term</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                placeholder="Enter search term..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Search By</label>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
            >
              <option value="equipmentName">Equipment Name</option>
              <option value="itemId">Item ID</option>
              <option value="serialNumber">Serial Number</option>
              <option value="category">Category</option>
              <option value="location">Location</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Quick Filters
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
            >
              <option value="All">All Status</option>
              <option value="Available">Available Only</option>
              <option value="Issued">Issued Only</option>
              <option value="Damaged">Damaged Only</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">Filter by Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-slate-400">
            Found {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSearchBy('equipmentName');
              setFilterCategory('All');
              setFilterStatus('All');
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
          >
            Clear All Filters
          </button>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
