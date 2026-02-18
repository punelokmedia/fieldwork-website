import { Share2, Download, Table, FileText, Image, Video, BarChart2 } from 'lucide-react';

const AnalyticsPanel = ({ reports }) => {
  const total = reports.length;
  const published = reports.filter(r => r.status === 'published').length;
  const pending = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow border border-red-100">
        <div className="text-gray-500 text-sm">Total Reports</div>
        <div className="text-2xl font-bold text-gray-800">{total}</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border border-green-100">
        <div className="text-gray-500 text-sm">Published</div>
        <div className="text-2xl font-bold text-green-600">{published}</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border border-yellow-100">
        <div className="text-gray-500 text-sm">Pending Review</div>
        <div className="text-2xl font-bold text-yellow-600">{pending}</div>
      </div>
    </div>
  );
};

const ExportButton = ({ reports }) => {
  const handleExport = () => {
    const headers = ["ID", "Title", "Description", "Status", "Date", "Location (Lat/Lon)"];
    const rows = reports.map(r => [
      r._id,
      r.title,
      r.description,
      r.status,
      new Date(r.createdAt).toLocaleDateString(),
      r.location?.latitude ? `${r.location.latitude},${r.location.longitude}` : 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "field_reports.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={handleExport} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 bg-white border px-3 py-2 rounded-md">
      <Download size={16} />
      <span>Export CSV</span>
    </button>
  );
};

export { AnalyticsPanel, ExportButton };
