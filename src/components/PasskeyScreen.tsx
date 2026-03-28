import { useState, useEffect } from 'react';
import { getSetting, saveSetting } from '../lib/db';
import { Lock } from 'lucide-react';

export default function PasskeyScreen({ onUnlock }: { onUnlock: () => void }) {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState(false);
  const [savedPasskey, setSavedPasskey] = useState('537901');

  useEffect(() => {
    getSetting('passkey').then((key) => {
      if (key) setSavedPasskey(key);
    });
  }, []);

  const handleKeyPress = (num: string) => {
    if (passkey.length < 6) {
      setPasskey((prev) => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPasskey((prev) => prev.slice(0, -1));
    setError(false);
  };

  useEffect(() => {
    if (passkey.length === 6) {
      if (passkey === savedPasskey) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => setPasskey(''), 500);
      }
    }
  }, [passkey, savedPasskey, onUnlock]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-semibold">Enter Passkey</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Default is 537901</p>
      </div>

      <div className="flex gap-4 mb-12">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-colors ${
              i < passkey.length
                ? 'bg-blue-600 dark:bg-blue-400'
                : 'bg-gray-300 dark:bg-gray-700'
            } ${error ? 'bg-red-500 animate-pulse' : ''}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-xs w-full px-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-sm text-2xl font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-sm text-2xl font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
