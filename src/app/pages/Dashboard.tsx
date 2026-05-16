import { useEffect, useState } from 'react';
import { getDB, InventoryItem, IssuanceRecord } from '../utils/db';
import { Package, CheckCircle, AlertCircle, XCircle, TrendingDown, FileText, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    available: 0,
    issued: 0,
    damaged: 0,
    lowStock: 0,
    pendingReturns: 0,
    defective: 0,
  });
  const [recentIssuances, setRecentIssuances] = useState<IssuanceRecord[]>([]);
  const [recentReturns, setRecentReturns] = useState<IssuanceRecord[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const db = await getDB();
    const items = await db.getAll('items');
    const issuances = await db.getAll('issuances');

    const available = items.filter((i) => i.status === 'Available').length;
    const issued = items.filter((i) => i.status === 'Issued').length;
    const damaged = items.filter((i) => i.status === 'Damaged').length;
    const lowStock = items.filter((i) => i.quantity < 10).length;
    const pendingReturns = issuances.filter((i) => i.status === 'Issued').length;
    const defective = items.filter((i) => i.condition === 'Repair Needed').length;

    setStats({
      totalItems: items.length,
      available,
      issued,
      damaged,
      lowStock,
      pendingReturns,
      defective,
    });

    const sortedIssuances = [...issuances].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setRecentIssuances(sortedIssuances.filter(i => i.status === 'Issued').slice(0, 5));
    setRecentReturns(sortedIssuances.filter(i => i.status === 'Returned').slice(0, 5));

    const lowStockList = items
      .filter((i) => i.quantity < 10)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);
    setLowStockItems(lowStockList);
  };

  const StatCard = ({ title, value, icon: Icon, color, link }: any) => (
    <Link to={link} className="block">
      <div className={`p-6 bg-slate-800 border border-slate-700 rounded-lg hover:border-${color}-500 transition-all`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-400 text-sm">{title}</h3>
          <Icon className={`w-6 h-6 text-${color}-500`} />
        </div>
        <p className="text-3xl text-white">{value}</p>
      </div>
    </Link>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl text-white mb-2">Dashboard Overview</h1>
        <p className="text-slate-400">Real-time inventory status and alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Inventory Items" value={stats.totalItems} icon={Package} color="blue" link="/inventory" />
        <StatCard title="Available Items" value={stats.available} icon={CheckCircle} color="green" link="/inventory?status=Available" />
        <StatCard title="Issued Equipment" value={stats.issued} icon={FileText} color="yellow" link="/issue" />
        <StatCard title="Damaged Items" value={stats.damaged} icon={XCircle} color="red" link="/inventory?status=Damaged" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-orange-900/20 border border-orange-500 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-orange-300">Low Stock Alerts</h3>
            <TrendingDown className="w-6 h-6 text-orange-500" />
          </div>
          <p className="text-3xl text-white">{stats.lowStock}</p>
        </div>

        <div className="p-6 bg-yellow-900/20 border border-yellow-500 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-yellow-300">Pending Returns</h3>
            <RotateCcw className="w-6 h-6 text-yellow-500" />
          </div>
          <p className="text-3xl text-white">{stats.pendingReturns}</p>
        </div>

        <div className="p-6 bg-red-900/20 border border-red-500 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-red-300">Defective Equipment</h3>
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-3xl text-white">{stats.defective}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl text-white mb-4">Recently Issued Equipment</h2>
          <div className="space-y-3">
            {recentIssuances.length === 0 ? (
              <p className="text-slate-400 text-sm">No recent issuances</p>
            ) : (
              recentIssuances.map((issuance) => (
                <div key={issuance.id} className="p-3 bg-slate-700 rounded">
                  <p className="text-white">{issuance.itemName}</p>
                  <p className="text-sm text-slate-400">
                    {issuance.borrowerRank} {issuance.borrowerName} - Qty: {issuance.quantity}
                  </p>
                  <p className="text-xs text-slate-500">
                    Issued: {new Date(issuance.dateIssued).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl text-white mb-4">Low Stock Items</h2>
          <div className="space-y-3">
            {lowStockItems.length === 0 ? (
              <p className="text-slate-400 text-sm">All items adequately stocked</p>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className="p-3 bg-orange-900/20 border border-orange-500/50 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white">{item.equipmentName}</p>
                      <p className="text-sm text-slate-400">{item.itemId}</p>
                    </div>
                    <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl text-white mb-4">Recent Returns</h2>
        <div className="space-y-3">
          {recentReturns.length === 0 ? (
            <p className="text-slate-400 text-sm">No recent returns</p>
          ) : (
            recentReturns.map((issuance) => (
              <div key={issuance.id} className="p-3 bg-slate-700 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white">{issuance.itemName}</p>
                    <p className="text-sm text-slate-400">
                      {issuance.borrowerRank} {issuance.borrowerName} - Qty: {issuance.quantity}
                    </p>
                    <p className="text-xs text-slate-500">
                      Returned: {issuance.actualReturnDate ? new Date(issuance.actualReturnDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                    {issuance.returnCondition}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
