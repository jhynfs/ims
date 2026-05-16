import { useEffect, useState } from 'react';
import { getDB, IssuanceRecord } from '../utils/db';
import { useAuth } from '../contexts/AuthContext';
import { RotateCcw, X } from 'lucide-react';

export function Returns() {
  const [issuedItems, setIssuedItems] = useState<IssuanceRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedIssuance, setSelectedIssuance] = useState<IssuanceRecord | null>(null);
  const { addAuditLog, user } = useAuth();

  const [returnData, setReturnData] = useState({
    actualReturnDate: new Date().toISOString().split('T')[0],
    returnCondition: 'Good',
    returnRemarks: '',
  });

  useEffect(() => {
    loadIssuedItems();
  }, []);

  const loadIssuedItems = async () => {
    const db = await getDB();
    const allIssuances = await db.getAll('issuances');
    setIssuedItems(allIssuances.filter(i => i.status === 'Issued'));
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssuance) return;

    const db = await getDB();

    const updatedIssuance: IssuanceRecord = {
      ...selectedIssuance,
      ...returnData,
      status: 'Returned',
    };

    await db.put('issuances', updatedIssuance);

    const item = await db.get('items', selectedIssuance.itemId);
    if (item) {
      item.quantity += selectedIssuance.quantity;
      item.status = 'Available';
      if (returnData.returnCondition === 'Repair Needed') {
        item.status = 'Damaged';
        item.condition = 'Repair Needed';
      }
      item.updatedAt = new Date().toISOString();
      await db.put('items', item);
    }

    await addAuditLog(
      'Return Equipment',
      `Returned ${selectedIssuance.quantity} ${selectedIssuance.itemName} from ${selectedIssuance.borrowerRank} ${selectedIssuance.borrowerName}`,
      JSON.stringify(returnData)
    );

    loadIssuedItems();
    closeModal();
  };

  const openReturnModal = (issuance: IssuanceRecord) => {
    if (user?.role === 'Viewer') {
      alert('You do not have permission to process returns');
      return;
    }
    setSelectedIssuance(issuance);
    setReturnData({
      actualReturnDate: new Date().toISOString().split('T')[0],
      returnCondition: 'Good',
      returnRemarks: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedIssuance(null);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl text-white mb-2">Return System</h1>
        <p className="text-slate-400">Process equipment returns</p>
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
                <th className="px-4 py-3 text-left text-sm text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {issuedItems.map((issuance) => {
                const isOverdue = new Date(issuance.expectedReturn) < new Date();
                return (
                  <tr key={issuance.id} className={`border-t border-slate-700 hover:bg-slate-700/50 ${isOverdue ? 'bg-red-900/20' : ''}`}>
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
                      {isOverdue && <span className="ml-2 text-red-400 text-xs">OVERDUE</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{issuance.purpose}</td>
                    <td className="px-4 py-3">
                      {user?.role !== 'Viewer' && (
                        <button
                          onClick={() => openReturnModal(issuance)}
                          className="flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Process Return
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedIssuance && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl text-white">Process Return</h2>
              <button onClick={closeModal}>
                <X className="w-6 h-6 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleReturn} className="p-6 space-y-4">
              <div className="p-4 bg-slate-700 rounded">
                <p className="text-sm text-slate-400">Item</p>
                <p className="text-white">{selectedIssuance.itemName}</p>
                <p className="text-sm text-slate-400 mt-2">Borrower</p>
                <p className="text-white">{selectedIssuance.borrowerRank} {selectedIssuance.borrowerName}</p>
                <p className="text-sm text-slate-400 mt-2">Quantity</p>
                <p className="text-white">{selectedIssuance.quantity}</p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Actual Return Date *</label>
                <input
                  type="date"
                  value={returnData.actualReturnDate}
                  onChange={(e) => setReturnData({ ...returnData, actualReturnDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Return Condition *</label>
                <select
                  value={returnData.returnCondition}
                  onChange={(e) => setReturnData({ ...returnData, returnCondition: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                >
                  <option value="Good">Good</option>
                  <option value="Repair Needed">Repair Needed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Return Remarks</label>
                <textarea
                  value={returnData.returnRemarks}
                  onChange={(e) => setReturnData({ ...returnData, returnRemarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                  rows={3}
                  placeholder="Any notes about the returned equipment"
                />
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
                  Complete Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
