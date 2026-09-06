
import React, { useState } from 'react';
import { Film, Copy, Check } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import Loader from '../components/Loader';
import { generateText } from '../services/geminiService';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useSettings } from '../context/SettingsContext';

const VideoScriptGenerator: React.FC = () => {
  const [description, setDescription] = useState('');
  const [script, setScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  const [isCopied, setIsCopied] = useState(false);
  const { settings } = useSettings();

  const handleCopy = () => {
    if (script) {
      navigator.clipboard.writeText(script);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('অনুগ্রহ করে পণ্যের বিবরণ দিন।');
      return;
    }
    setError('');
    setIsLoading(true);
    setScript('');
    setIsCopied(false);

    // For mobile, switch to output tab
    if (window.innerWidth < 1024) {
      setActiveTab('output');
    }

    let businessInfo = '';
    if (settings.businessName) businessInfo += `Business Name: ${settings.businessName}\n`;
    if (settings.phone) businessInfo += `Phone Number: ${settings.phone}\n`;
    if (settings.facebookPage) businessInfo += `Facebook Page: ${settings.facebookPage}\n`;
    if (settings.website) businessInfo += `Website: ${settings.website}\n`;

    const prompt = `আপনি একজন বিশেষজ্ঞ ভিডিও মার্কেটিং স্ট্র্যাটেজিস্ট এবং একজন সৃজনশীল পরিচালক। আপনার কাজ হলো প্রদত্ত পণ্যের উপর ভিত্তি করে একটি সম্পূর্ণ এবং বিস্তারিত ফেসবুক/ইনস্টাগ্রাম রিলস ভিডিও স্ক্রিপ্ট তৈরি করা।

স্ক্রিপ্টটি অবশ্যই বাংলায় হতে হবে এবং তিনটি প্রধান স্তরে বিভক্ত থাকবে: Awareness, Consideration, এবং Conversion। প্রতিটি স্তরের জন্য, আপনাকে নিম্নলিখিত চারটি বিভাগ পূরণ করতে হবে:

**ব্যবসার তথ্য (প্রয়োজনে ব্যবহারের জন্য):**
---
${businessInfo.trim() ? businessInfo : 'কোনো তথ্য দেওয়া হয়নি।'}
---

**স্ক্রিপ্টের গঠন:**

---
**স্তর ১: Awareness (সচেতনতা)**
*   **লক্ষ্য:** [এই ধাপের মূল উদ্দেশ্য কী, যেমন: দর্শকদের মনোযোগ আকর্ষণ করা এবং একটি সাধারণ সমস্যার সাথে তাদের পরিচয় করিয়ে দেওয়া।]
*   **ভয়েসওভার/ডায়ালগ:** [এখানে ভয়েসওভারের জন্য সঠিক বাংলা লাইনগুলো লিখুন।]
*   **ভিজ্যুয়াল নির্দেশনা:** [এই অংশে কী দেখানো হবে তার বিস্তারিত বর্ণনা দিন। যেমন: শটের প্রকার (ক্লোজ-আপ, ওয়াইড শট), ক্যামেরার নড়াচড়া, টেক্সট ওভারলে, এবং দৃশ্যের পরিবেশ।]
*   **টিপস:** [এই ধাপটিকে আরও কার্যকর করার জন্য একটি ছোট টিপস দিন।]

---
**স্তর ২: Consideration (বিবেচনা)**
*   **লক্ষ্য:** [এই ধাপের মূল উদ্দেশ্য কী, যেমন: পণ্যটিকে সমস্যার সমাধান হিসেবে উপস্থাপন করা এবং এর প্রধান বৈশিষ্ট্য ও সুবিধাগুলো তুলে ধরা।]
*   **ভয়েসওভার/ডায়ালগ:** [এখানে ভয়েসওভারের জন্য সঠিক বাংলা লাইনগুলো লিখুন।]
*   **ভিজ্যুয়াল নির্দেশনা:** [পণ্যের ডেমোনস্ট্রেশন, ব্যবহারের দৃশ্য, ফিচার হাইলাইট করার জন্য গ্রাফিক্স বা টেক্সট ওভারলে ইত্যাদি সম্পর্কে বিস্তারিত লিখুন।]
*   **টিপস:** [এই ধাপটিকে আরও কার্যকর করার জন্য একটি ছোট টিপস দিন।]

---
**স্তর ৩: Conversion (রূপান্তর)**
*   **লক্ষ্য:** [এই ধাপের মূল উদ্দেশ্য কী, যেমন: দর্শকদের পণ্যটি কেনার জন্য উৎসাহিত করা এবং একটি জরুরি অনুভূতি তৈরি করা।]
*   **ভয়েসওভার/ডায়ালগ:** [একটি শক্তিশালী কল-টু-অ্যাকশন সহ চূড়ান্ত ভয়েসওভার লিখুন। প্রদত্ত ব্যবসার তথ্য (যেমন: ফোন, ওয়েবসাইট, ফেসবুক পেজ) এখানে ব্যবহার করুন।]
*   **ভিজ্যুয়াল নির্দেশনা:** [চূড়ান্ত পণ্যের শট, প্যাকেজিং, একটি বিশেষ অফার দেখানো, এবং কীভাবে অর্ডার করতে হবে তার নির্দেশনা (যেমন: "Shop Now" বাটন) ইত্যাদি বর্ণনা করুন।]
*   **টিপস:** [এই ধাপটিকে আরও কার্যকর করার জন্য একটি ছোট টিপস দিন।]

---

অনুগ্রহ করে উপরের গঠনটি কঠোরভাবে অনুসরণ করুন এবং শুধুমাত্র চূড়ান্ত স্ক্রিপ্টটি প্রদান করুন, কোনো অতিরিক্ত ভূমিকা বা ব্যাখ্যা ছাড়াই।

**পণ্যের বিবরণ:**
---
${description}
---`;

    try {
      const result = await generateText(prompt);
      setScript(result);
    } catch (err) {
      setError('স্ক্রিপ্ট তৈরি করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
      if (window.innerWidth < 1024) {
        setActiveTab('input'); // On error, go back to input on mobile
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const OutputComponent = () => (
    <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-gray-300">জেনারেটেড ভিডিও স্ক্রিপ্ট</h3>
        {script && (
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            {isCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            {isCopied ? 'কপি হয়েছে' : 'কপি করুন'}
          </button>
        )}
      </div>
      <div className="w-full min-h-[300px] max-h-[60vh] overflow-y-auto bg-[#0d1117] border border-gray-700 rounded-lg p-4 text-gray-200">
        {isLoading ? <Loader /> : script ? <MarkdownRenderer content={script} /> : <p className="text-gray-500">আপনার তৈরি করা স্ক্রিপ্ট এখানে দেখানো হবে...</p>}
      </div>
    </div>
  );

  return (
    <div>
      <ToolHeader
        icon={Film}
        title="ভিডিও স্ক্রিপ্ট জেনারেটর"
        description="পণ্যের জন্য সম্পূর্ণ ভিডিও মার্কেটিং ফানেল স্ক্রিপ্ট তৈরি করুন।"
      />

      {/* Desktop Layout */}
      <div className="hidden lg:grid grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="col-span-1 bg-[#161b22] border border-gray-800 p-6 rounded-xl">
          <label htmlFor="description-desktop" className="block text-lg font-medium text-gray-300 mb-2">
            পণ্যের বিবরণ
          </label>
          <textarea
            id="description-desktop"
            rows={10}
            className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="এখানে আপনার পণ্যের বিবরণ লিখুন..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
          {error && <p className="text-red-400 mt-2">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20"
          >
            {isLoading ? 'জেনারেট হচ্ছে...' : 'স্ক্রিপ্ট জেনারেট করুন'}
          </button>
        </div>

        {/* Output Section */}
        <div className="col-span-2">
            <OutputComponent />
        </div>
      </div>
      
      {/* Mobile/Tablet Tabbed Layout */}
      <div className="lg:hidden">
        <div className="border-b border-gray-700 mb-4">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('input')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'input'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              }`}
            >
              ইনপুট
            </button>
            <button
              onClick={() => setActiveTab('output')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'output'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              }`}
            >
              আউটপুট
            </button>
          </nav>
        </div>

        <div>
          {activeTab === 'input' && (
            <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl">
              <label htmlFor="description-mobile" className="block text-lg font-medium text-gray-300 mb-2">
                পণ্যের বিবরণ
              </label>
              <textarea
                id="description-mobile"
                rows={10}
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="এখানে আপনার পণ্যের বিবরণ লিখুন..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
              {error && <p className="text-red-400 mt-2">{error}</p>}
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20"
              >
                {isLoading ? 'জেনারেট হচ্ছে...' : 'স্ক্রিপ্ট জেনারেট করুন'}
              </button>
            </div>
          )}
          {activeTab === 'output' && <OutputComponent />}
        </div>
      </div>
    </div>
  );
};

export default VideoScriptGenerator;
