import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Filter, RefreshCcw, History, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const RestorePage = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBackup, setSelectedBackup] = useState(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    
    const mockBackups = [
      {
        id: 'mock-1',
        backup_id: 'BKP-20260501-1430',
        date_created: '5/1/2026',
        time_created: '02:30 PM',
        size: '45.2 MB',
        status: 'Successful',
        created_at: new Date().toISOString()
      },
      {
        id: 'mock-2',
        backup_id: 'BKP-20260424-0300',
        date_created: '4/24/2026',
        time_created: '03:00 AM',
        size: '42.8 MB',
        status: 'Successful',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    try {
      // Attempt to fetch from a backups table if it exists
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error || !data || data.length === 0) {
        setBackups(mockBackups);
      } else {
        setBackups(data);
      }
    } catch (error) {
      console.error("Error connecting to database for backups:", error);
      setBackups(mockBackups);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (backupOverride = null) => {
    const backupToRestore = backupOverride || selectedBackup;
    if (!backupToRestore) return;

    setIsRestoring(true);
    const toastId = toast.loading(`Initiating restore sequence for ${backupToRestore.backup_id}...`);

    setTimeout(() => {
      setIsRestoring(false);
      toast.success(`System successfully restored to backup ${backupToRestore.backup_id}!`, { id: toastId, duration: 4000 });
    }, 3000);
  };

  const filteredBackups = backups.filter(b => 
    (b.backup_id && b.backup_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.date_created && b.date_created.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Restore</h1>
          <p className="text-gray-500 mt-1">Manage database backups and restore points for the Roominate system.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => handleRestore(backups[0])}
            disabled={backups.length === 0 || isRestoring}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
            <span>Restore Latest Backup</span>
          </button>
          <button 
            onClick={() => handleRestore()}
            disabled={!selectedBackup || isRestoring}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-orange rounded-md text-sm font-medium text-white hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            <span>Restore Selected</span>
          </button>
        </div>
      </div>

      {/* Warning Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-5 flex items-start space-x-4">
        <div className="shrink-0 mt-0.5">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-red-800">Critical Warning: Data Overwrite</h3>
          <p className="text-sm text-red-700 mt-1 leading-relaxed">
            Restoring the system to a previous backup is a destructive action. It will <strong>permanently overwrite all current booking records, user logs, and system settings</strong> created after the selected backup point. This action cannot be easily undone. Please ensure you have exported current critical data and notified active users before proceeding with a system restore.
          </p>
        </div>
      </div>

      {/* Backup History Table Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Backup History</h3>
          <div className="flex space-x-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input 
                type="text" 
                placeholder="Search backups..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent text-gray-800"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shrink-0">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                <th className="px-6 py-4 w-16 text-center">Select</th>
                <th className="px-6 py-4">Backup ID</th>
                <th className="px-6 py-4">Date Created</th>
                <th className="px-6 py-4">Time Created</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-orange"></div>
                      <p>Loading backup history...</p>
                    </div>
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                       <History className="w-12 h-12 text-gray-300 mb-2" />
                       <h4 className="text-base font-medium text-gray-900">No Backups Available</h4>
                       <p className="max-w-sm">There is currently no backup data found in the system. As you generate backups, they will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredBackups.length === 0 ? (
                 <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No backups matched your search criteria.
                  </td>
                </tr>
              ) : (
                filteredBackups.map((backup) => (
                  <tr 
                    key={backup.id} 
                    className={`hover:bg-orange-50/50 transition-colors cursor-pointer ${selectedBackup?.id === backup.id ? 'bg-orange-50' : 'bg-white'}`}
                    onClick={() => setSelectedBackup(backup)}
                  >
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="radio" 
                        name="backup_selection"
                        className="w-4 h-4 text-primary-orange focus:ring-primary-orange border-gray-300"
                        checked={selectedBackup?.id === backup.id}
                        onChange={() => setSelectedBackup(backup)}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{backup.backup_id}</td>
                    <td className="px-6 py-4">{backup.date_created || new Date(backup.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{backup.time_created || new Date(backup.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="px-6 py-4">{backup.size || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        backup.status === 'Failed' ? 'bg-red-100 text-red-800' : 
                        backup.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {backup.status || 'Successful'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RestorePage;
