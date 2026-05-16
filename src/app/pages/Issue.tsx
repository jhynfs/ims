import { useEffect, useState } from 'react';
import { getDB, InventoryItem, IssuanceRecord } from '../utils/db';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X } from 'lucide-react';

export function Issue() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [issuances, setIssuances] = useState<IssuanceRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { addAuditLog, user } = useAuth();

  const [formData, setFormData] = useState({
    itemId: '',
    borrowerRank: '',
    borrowerName: '',
    dateIssued: new Date().toISOString().split('T')[0],
    expectedReturn: '',
    quantity: 1,
    purpose: '',
    approvingOfficer: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const db = await getDB();
    const allItems = await db.getAll('items');
    const allIssuances = await db.getAll('issuances');
    setItems(allItems.filter(i => i.status === 'Available'));
    setIssuances(allIssuances);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = await getDB();

    const selectedItem = items.find(i => i.id === formData.itemId);
    if (!selectedItem) return;

    if (formData.quantity > selectedItem.quantity) {
      alert('Insufficient quantity available');
      return;
    }

    const newIssuance: IssuanceRecord = {
      id: `issue-${Date.now()}`,
      itemId: selectedItem.id,
      itemName: selectedItem.equipmentName,
      ...formData,
      status: 'Issued',
      createdAt: new Date().toISOString(),
    };

    await db.add('issuances', newIssuance);

    selectedItem.quantity -= formData.quantity;
    if (selectedItem.quantity === 0) {
      selectedItem.status = 'Issued';
    }
    selectedItem.updatedAt = new Date().toISOString();
    await db.put('items', selectedItem);

    await addAuditLog(
      'Issue Equipment',
      `Issued ${formData.quantity} ${selectedItem.equipmentName} to ${formData.borrowerRank} ${formData.borrowerName}`,
      JSON.stringify(newIssuance)
    );

    loadData();
    closeModal();
  };

  const openModal = () => {
    if (user?.role === 'Viewer') {
      alert('You do not have permission to issue equipment');
      return;
    }
    setFormData({
      itemId: '',
      borrowerRank: '',
      borrowerName: '',
      dateIssued: new Date().toISOString().split('T')[0],
      expectedReturn: '',
      quantity: 1,
      purpose: '',
      approvingOfficer: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Issued': return 'bg-yellow-600';
      case 'Returned': return 'bg-green-600';
      case 'Overdue': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const isOverdue = (expectedReturn: string, status: string) => {
    if (status !== 'Issued') return false;
    return new Date(expectedReturn) < new Date();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl text-white mb-2">Issuance / Borrowing System</h1>
          <p className="text-slate-400">Track equipment issued to personnel</p>
        </div>
        {user?.role !== 'Viewer' && (
          <button
            onClick={openModal}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          >
            <Plus className="w-5 h-5 mr-2" />
            Issue Equipment
          </button>
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Item Name</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Borrower</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Quantity</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Date Issued</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Expected Return</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Purpose</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Approving Officer</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {issuances.map((issuance) => {
                const overdue = isOverdue(issuance.expectedReturn, issuance.status);
                return (
                  <tr key={issuance.id} className={`border-t border-slate-700 hover:bg-slate-700/50 ${overdue ? 'bg-red-900/20' : ''}`}>
                    <td className="px-4 py-3 text-white">{issuance.itemName}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {issuance.borrowerRank} {issuance.borrowerName}
                    </td>
                    <td className="px-4 py-3 text-white">{issuance.quantity}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(issuance.dateIssued).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(issuance.expectedReturn).toLocaleDateString()}
                      {overdue && <span className="ml-2 text-red-400 text-xs">OVERDUE</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{issuance.purpose}</td>
                    <td className="px-4 py-3 text-slate-300">{issuance.approvingOfficer}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 ${getStatusColor(overdue ? 'Overdue' : issuance.status)} text-white text-xs rounded`}>
                        {overdue ? 'Overdue' : issuance.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl text-white">Issue Equipment</h2>
              <button onClick={closeModal}>
                <X className="w-6 h-6 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-slate-300 mb-2">Select Item *</label>
                  <select
                    value={formData.itemId}
                    onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    required
                  >
                    <option value="">-- Select Equipment --</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.equipmentName} ({item.itemId}) - Available: {item.quantity}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Borrower Rank *</label>
                  <input
                    type="text"
                    value={formData.borrowerRank}
                    onChange={(e) => setFormData({ ...formData, borrowerRank: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    placeholder="e.g., Captain"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Borrower Name *</label>
                  <input
                    type="text"
                    value={formData.borrowerName}
                    onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    placeholder="Full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Date Issued *</label>
                  <input
                    type="date"
                    value={formData.dateIssued}
                    onChange={(e) => setFormData({ ...formData, dateIssued: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Expected Return *</label>
                  <input
                    type="date"
                    value={formData.expectedReturn}
                    onChange={(e) => setFormData({ ...formData, expectedReturn: e.target.value })}
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
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Approving Officer *</label>
                  <input
                    type="text"
                    value={formData.approvingOfficer}
                    onChange={(e) => setFormData({ ...formData, approvingOfficer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    placeholder="Officer name"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-slate-300 mb-2">Purpose *</label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                    rows={3}
                    placeholder="Reason for issuance"
                    required
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
                  Issue Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
