import { useEffect, useState } from 'react';
import { getDB, AuditLog } from '../utils/db';
import { ScrollText, Filter } from 'lucide-react';

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState('All');

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filterAction]);

  const loadLogs = async () => {
    const db = await getDB();
    const allLogs = await db.getAll('auditLogs');
    const sorted = allLogs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setLogs(sorted);
  };

  const applyFilters = () => {
    if (filterAction === 'All') {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter(log => log.action === filterAction));
    }
  };

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

  const getActionColor = (action: string) => {
    if (action.includes('Add') || action.includes('Create')) return 'text-green-400';
    if (action.includes('Edit') || action.includes('Update')) return 'text-blue-400';
    if (action.includes('Delete')) return 'text-red-400';
    if (action.includes('Issue')) return 'text-yellow-400';
    if (action.includes('Return')) return 'text-purple-400';
    if (action.includes('Login')) return 'text-cyan-400';
    if (action.includes('Logout')) return 'text-slate-400';
    return 'text-slate-300';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <ScrollText className="w-8 h-8 text-blue-500 mr-3" />
          <h1 className="text-3xl text-white">Audit Logs</h1>
        </div>
        <p className="text-slate-400">Track all system activities and changes</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <div className="flex-1">
            <label className="block text-sm text-slate-400 mb-2">Filter by Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full max-w-xs px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
            >
              <option value="All">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Total Logs</p>
            <p className="text-2xl text-white">{filteredLogs.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Action</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Description</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">User</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-slate-300 text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white">{log.description}</td>
                  <td className="px-4 py-3 text-slate-300">{log.userName}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {log.details ? (
                      <details className="cursor-pointer">
                        <summary className="text-blue-400 hover:text-blue-300">View</summary>
                        <pre className="mt-2 p-2 bg-slate-900 rounded text-xs overflow-x-auto">
                          {log.details}
                        </pre>
                      </details>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
