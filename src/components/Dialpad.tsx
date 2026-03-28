import { useState } from 'react';
import { Phone, Delete, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatPhone } from '../lib/phone';
import { addCallLog } from '../lib/db';

export default function Dialpad() {
  const [number, setNumber] = useState('');
  const navigate = useNavigate();

  const handleKeyPress = (num: string) => {
    if (number.length < 15) {
      setNumber((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = async () => {
    if (number) {
      await addCallLog(number, undefined, 'outgoing');
      window.location.href = `tel:${number}`;
    }
  };

  const handleAddContact = () => {
    if (number) {
      navigate(`/add?phone=${encodeURIComponent(number)}`);
    }
  };

  const dialpadKeys = [
    { num: '1', letters: '' },
    { num: '2', letters: 'ABC' },
    { num: '3', letters: 'DEF' },
    { num: '4', letters: 'GHI' },
    { num: '5', letters: 'JKL' },
    { num: '6', letters: 'MNO' },
    { num: '7', letters: 'PQRS' },
    { num: '8', letters: 'TUV' },
    { num: '9', letters: 'WXYZ' },
    { num: '*', letters: '' },
    { num: '0', letters: '+' },
    { num: '#', letters: '' },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex-1 flex flex-col pb-8 px-6">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-4xl font-medium text-gray-900 dark:text-white tracking-wider break-all px-4 text-center">
            {formatPhone(number) || ' '}
          </h2>
          {number && (
            <button
              onClick={handleAddContact}
              className="mt-4 text-blue-600 dark:text-blue-400 font-medium text-sm flex items-center gap-1"
            >
              <UserPlus className="w-4 h-4" /> Add to contacts
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-y-6 gap-x-8 max-w-xs mx-auto w-full">
          {dialpadKeys.map((key) => (
            <button
              key={key.num}
              onClick={() => handleKeyPress(key.num)}
              className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
            >
              <span className="text-3xl font-medium text-gray-900 dark:text-white">{key.num}</span>
              {key.letters && (
                <span className="text-[10px] font-medium text-gray-500 tracking-widest uppercase">
                  {key.letters}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center max-w-xs mx-auto w-full mt-8 px-4">
          <div className="w-16" /> {/* Spacer */}
          <button
            onClick={handleCall}
            className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors active:scale-95"
          >
            <Phone className="w-8 h-8 fill-current" />
          </button>
          <button
            onClick={handleDelete}
            onContextMenu={(e) => {
              e.preventDefault();
              setNumber('');
            }}
            className="w-16 h-16 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors active:scale-95"
          >
            {number && <Delete className="w-8 h-8" />}
          </button>
        </div>
      </div>
    </div>
  );
}
