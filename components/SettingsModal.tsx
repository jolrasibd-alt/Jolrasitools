
import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
      setIsSaved(false); // Reset for next time
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#161b22] border border-gray-800 rounded-xl shadow-lg w-full max-w-lg p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">ব্যবসার তথ্য</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-300 mb-1">ব্যবসার নাম</label>
            <input type="text" name="businessName" id="businessName" value={localSettings.businessName} onChange={handleChange} className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-1">ওয়েবসাইট</label>
            <input type="url" name="website" id="website" value={localSettings.website} onChange={handleChange} className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="https://example.com" />
          </div>
          <div>
            <label htmlFor="facebookPage" className="block text-sm font-medium text-gray-300 mb-1">ফেসবুক পেজ</label>
            <input type="url" name="facebookPage" id="facebookPage" value={localSettings.facebookPage} onChange={handleChange} className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-2 focus:ring-indigo-500" placeholder="https://facebook.com/yourpage" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">ফোন নম্বর</label>
            <input type="tel" name="phone" id="phone" value={localSettings.phone} onChange={handleChange} className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaved}
            className={`font-semibold py-2 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 w-36 ${
                isSaved
                ? 'bg-green-600 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white hover:opacity-90'
            }`}
          >
            {isSaved ? (
              <>
                <CheckCircle size={18} />
                <span>সেভ হয়েছে!</span>
              </>
            ) : (
              <span>সেভ করুন</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
