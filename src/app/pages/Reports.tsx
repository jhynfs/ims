import { useEffect, useState } from 'react';
import { getDB, InventoryItem, IssuanceRecord } from '../utils/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText } from 'lucide-react';

export function Reports() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [issuances, setIssuances] = useState<IssuanceRecord[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    available: 0,
    issued: 0,
    damaged: 0,
    totalValue: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const db = await getDB();
    const allItems = await db.getAll('items');
    const allIssuances = await db.getAll('issuances');

    setItems(allItems);
    setIssuances(allIssuances);

    setStats({
      totalItems: allItems.length,
      available: allItems.filter(i => i.status === 'Available').length,
      issued: allItems.filter(i => i.status === 'Issued').length,
      damaged: allItems.filter(i => i.status === 'Damaged').length,
      totalValue: allItems.reduce((sum, item) => sum + item.quantity, 0),
    });
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateInventorySummaryPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Inventory Summary Report', 14, 22);

    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    doc.setFontSize(12);
    doc.text('Overview Statistics', 14, 42);

    const summaryData = [
      ['Total Items', stats.totalItems.toString()],
      ['Available Items', stats.available.toString()],
      ['Issued Items', stats.issued.toString()],
      ['Damaged Items', stats.damaged.toString()],
      ['Total Units', stats.totalValue.toString()],
    ];

    autoTable(doc, {
      startY: 46,
      head: [['Metric', 'Count']],
      body: summaryData,
    });

    const itemsData = items.map(item => [
      item.itemId,
      item.equipmentName,
      item.category,
      item.quantity.toString(),
      item.status,
      item.condition,
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Item ID', 'Equipment Name', 'Category', 'Quantity', 'Status', 'Condition']],
      body: itemsData,
    });

    doc.save('inventory-summary.pdf');
  };

  const generateIssuedEquipmentPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Issued Equipment Report', 14, 22);

    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    const issuedData = issuances
      .filter(i => i.status === 'Issued')
      .map(issuance => [
        issuance.itemName,
        `${issuance.borrowerRank} ${issuance.borrowerName}`,
        issuance.quantity.toString(),
        new Date(issuance.dateIssued).toLocaleDateString(),
        new Date(issuance.expectedReturn).toLocaleDateString(),
        issuance.purpose,
      ]);

    autoTable(doc, {
      startY: 40,
      head: [['Item', 'Borrower', 'Qty', 'Issued', 'Expected Return', 'Purpose']],
      body: issuedData,
    });

    doc.save('issued-equipment.pdf');
  };

  const generateDamagedEquipmentPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Damaged Equipment Report', 14, 22);

    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    const damagedData = items
      .filter(i => i.status === 'Damaged' || i.condition === 'Repair Needed')
      .map(item => [
        item.itemId,
        item.equipmentName,
        item.serialNumber,
        item.quantity.toString(),
        item.condition,
        item.remarks,
      ]);

    autoTable(doc, {
      startY: 40,
      head: [['Item ID', 'Equipment Name', 'Serial Number', 'Quantity', 'Condition', 'Remarks']],
      body: damagedData,
    });

    doc.save('damaged-equipment.pdf');
  };

  const generateMonthlyTransactionsPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Monthly Transactions Report', 14, 22);

    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyIssuances = issuances.filter(i => {
      const date = new Date(i.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const transactionData = monthlyIssuances.map(issuance => [
      new Date(issuance.createdAt).toLocaleDateString(),
      issuance.itemName,
      `${issuance.borrowerRank} ${issuance.borrowerName}`,
      issuance.quantity.toString(),
      issuance.status,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Item', 'Borrower', 'Quantity', 'Status']],
      body: transactionData,
    });

    doc.save('monthly-transactions.pdf');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl text-white mb-2">Reports</h1>
        <p className="text-slate-400">Generate and export reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="text-slate-400 text-sm mb-2">Total Items</h3>
          <p className="text-3xl text-white">{stats.totalItems}</p>
        </div>
        <div className="p-6 bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="text-slate-400 text-sm mb-2">Available</h3>
          <p className="text-3xl text-green-500">{stats.available}</p>
        </div>
        <div className="p-6 bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="text-slate-400 text-sm mb-2">Issued</h3>
          <p className="text-3xl text-yellow-500">{stats.issued}</p>
        </div>
        <div className="p-6 bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="text-slate-400 text-sm mb-2">Damaged</h3>
          <p className="text-3xl text-red-500">{stats.damaged}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-blue-500 mr-3" />
            <div>
              <h2 className="text-xl text-white">Inventory Summary</h2>
              <p className="text-sm text-slate-400">Complete inventory overview</p>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={generateInventorySummaryPDF}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </button>
            <button
              onClick={() => exportToCSV(items, 'inventory-summary.csv')}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as CSV
            </button>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-yellow-500 mr-3" />
            <div>
              <h2 className="text-xl text-white">Issued Equipment Report</h2>
              <p className="text-sm text-slate-400">Currently issued items</p>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={generateIssuedEquipmentPDF}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </button>
            <button
              onClick={() => exportToCSV(issuances.filter(i => i.status === 'Issued'), 'issued-equipment.csv')}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as CSV
            </button>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <h2 className="text-xl text-white">Damaged Equipment Report</h2>
              <p className="text-sm text-slate-400">Items needing repair</p>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={generateDamagedEquipmentPDF}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </button>
            <button
              onClick={() => exportToCSV(items.filter(i => i.status === 'Damaged'), 'damaged-equipment.csv')}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as CSV
            </button>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-purple-500 mr-3" />
            <div>
              <h2 className="text-xl text-white">Monthly Transactions</h2>
              <p className="text-sm text-slate-400">Current month activity</p>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={generateMonthlyTransactionsPDF}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </button>
            <button
              onClick={() => exportToCSV(issuances, 'monthly-transactions.csv')}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
