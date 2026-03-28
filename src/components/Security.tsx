import { useState, useEffect } from 'react';
import { Shield, Lock, Key, Trash2, Power, AlertTriangle } from 'lucide-react';
import { getSetting, saveSetting } from '../lib/db';

export default function Security() {
  const [passkeyEnabled, setPasskeyEnabled] = useState(true);
  const [newPasskey, setNewPasskey] = useState('');
  const [isChangingPasskey, setIsChangingPasskey] = useState(false);

  useEffect(() => {
    getSetting('passkeyEnabled').then((enabled) => {
      if (enabled === false) {
        setPasskeyEnabled(false);
      }
    });
  }, []);

  const handleTogglePasskey = async () => {
    const newState = !passkeyEnabled;
    await saveSetting('passkeyEnabled', newState);
    setPasskeyEnabled(newState);
  };

  const handleChangePasskey = async () => {
    if (newPasskey.length !== 6 || isNaN(Number(newPasskey))) {
      alert('Passkey must be exactly 6 digits.');
      return;
    }
    await saveSetting('passkey', newPasskey);
    setNewPasskey('');
    setIsChangingPasskey(false);
    alert('Passkey updated successfully!');
  };

  const handleLockApp = () => {
    window.location.reload(); // Reloading will trigger the passkey screen
  };

  const handleClearData = async () => {
    if (window.confirm('WARNING: This will delete ALL contacts, groups, and settings. This action cannot be undone. Are you absolutely sure?')) {
      if (window.confirm('Final confirmation: Delete everything?')) {
        const dbs = await window.indexedDB.databases();
        for (const db of dbs) {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }
        window.location.reload();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center p-4 bg-white dark:bg-gray-900 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white ml-2">Security Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        {/* Passkey Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${passkeyEnabled ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">App Lock</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Require passkey to open app</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={passkeyEnabled}
                onChange={handleTogglePasskey}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Change Passkey */}
        {passkeyEnabled && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">Change Passkey</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Update your 6-digit PIN</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChangingPasskey(!isChangingPasskey)}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {isChangingPasskey ? 'Cancel' : 'Change'}
              </button>
            </div>

            {isChangingPasskey && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="New 6-digit Passkey"
                  value={newPasskey}
                  onChange={(e) => setNewPasskey(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleChangePasskey}
                  disabled={newPasskey.length !== 6}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        )}

        {/* Lock App Now */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <button 
            onClick={handleLockApp}
            className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                <Power className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-medium text-gray-900 dark:text-white">Lock App Now</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Require passkey to re-enter</p>
              </div>
            </div>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-red-100 dark:border-red-900/30">
          <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </h3>
          <button 
            onClick={handleClearData}
            className="w-full flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <Trash2 className="w-5 h-5" />
              <span className="text-sm font-medium">Erase All Data</span>
            </div>
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            This will permanently delete all contacts, groups, and settings from this device.
          </p>
        </div>

      </div>
    </div>
  );
}
