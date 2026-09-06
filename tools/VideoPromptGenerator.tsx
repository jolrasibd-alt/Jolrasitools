
import React, { useState } from 'react';
import { Lightbulb, Copy, Check } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import { generateText } from '../services/geminiService';
import Loader from '../components/Loader';
import MarkdownRenderer from '../components/MarkdownRenderer';

const VideoPromptGenerator: React.FC = () => {
  const [productDesc, setProductDesc] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleGenerate = async () => {
    if (!productDesc.trim()) {
      setError('অনুগ্রহ করে পণ্যের ধারণা দিন।');
      return;
    }
    setError('');
    setIsLoading(true);
    setResult('');
    setIsCopied(false);

    const prompt = `আপনি একটি হাই-ফ্যাশন ব্র্যান্ডের ক্রিয়েটিভ ডিরেক্টর। প্রদত্ত পণ্যের ধারণার উপর ভিত্তি করে, সোশ্যাল মিডিয়া রিলের (যেমন: ইনস্টাগ্রাম বা টিকটক) জন্য একটি ছোট কিন্তু আকর্ষণীয় ভিডিও স্ক্রিপ্ট বা প্রম্পট তৈরি করুন। প্রম্পটটি অবশ্যই বাংলায় হতে হবে এবং নিম্নলিখিত মার্কডাউন হেডিংগুলো ব্যবহার করে গঠন করতে হবে: '**কনসেপ্ট/থিম**:', '**দৃশ্য বর্ণনা**:', '**শট লিস্ট**:', এবং '**মিউজিক সাজেশন**:'। টোন হবে ট্রেন্ডি, পেশাদার এবং আকর্ষণীয়।

পণ্যের ধারণা: ${productDesc}`;
    
    try {
      const text = await generateText(prompt);
      setResult(text);
    } catch (err) {
      setError('প্রম্পট তৈরি করতে ব্যর্থ।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
        <ToolHeader
            icon={Lightbulb}
            title="ভিডিও প্রম্পট জেনারেটর"
            description="ফ্যাশন ভিডিওর জন্য সৃজনশীল আইডিয়া তৈরি করুন।"
        />
        <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-6">
            <textarea
                rows={5}
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-gray-200"
                placeholder="পণ্যের ধারণা বা বর্ণনা লিখুন..."
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
            />
            {error && <p className="text-red-400 text-center">{error}</p>}
            <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20">
                {isLoading ? "জেনারেট হচ্ছে..." : "ভিডিও প্রম্পট জেনারেট করুন"}
            </button>
            <div className="relative w-full min-h-[200px] bg-[#0d1117] border border-gray-700 rounded-lg p-4">
                {result && !isLoading && (
                     <button onClick={handleCopy} className="absolute top-2 right-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-gray-800/50 p-1 rounded">
                         {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                         {isCopied ? 'কপি হয়েছে' : 'কপি'}
                     </button>
                )}
                {isLoading && <Loader />}
                {result && <MarkdownRenderer content={result} />}
                {!isLoading && !result && <p className="text-gray-500">ফলাফল এখানে দেখানো হবে</p>}
            </div>
        </div>
    </div>
  );
}

export default VideoPromptGenerator;
