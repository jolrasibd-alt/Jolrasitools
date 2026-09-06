
import React, { useState } from 'react';
import { BrainCircuit, Copy, Check } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import Loader from '../components/Loader';
import { generateText } from '../services/geminiService';

interface GeneratedPrompts {
  concept: string;
  image: string;
  video: string;
}

const ConceptArchitect: React.FC = () => {
  const [keywords, setKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompts | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      setError('অনুগ্রহ করে আপনার কীওয়ার্ড লিখুন।');
      return;
    }
    setError('');
    setIsLoading(true);
    setGeneratedPrompts(null);

    const prompt1 = `Task: Visual Symbol & Concept Architect.
User Keywords: "${keywords}"
Goal: এই কীওয়ার্ডগুলোকে একটি সিম্বলিক এবং ক্লিন ভিজ্যুয়াল রেফারেন্স এবং ভিডিও প্রম্পটে রূপান্তর করো।

কঠোর নিয়মাবলী:
১. সিম্বল বনাম প্রোডাক্ট: যদি কীওয়ার্ডগুলো কোনো ভাবার্থ প্রকাশ করে (যেমন: "gift", "love", "security"), তবে কোনো নির্দিষ্ট বাণিজ্যিক প্রোডাক্ট বা ব্র্যান্ড দেখাবে না। তার বদলে ইউনিভার্সাল সিম্বল বা আইকন ব্যবহার করবে (যেমন: উজ্জ্বল গিফট বক্সের আইকন বা ট্রফির সিলুয়েট)।
২. নির্ভুলতা: কীওয়ার্ডের অর্থের বাইরে বাড়তি কোনো অবান্তর ফ্যান্টাসি যোগ করবে না।
৩. জিরো টেক্সট পলিসি: ছবিতে কোনোভাবেই কোনো টেক্সট, বর্ণমালা, বাংলা অক্ষর বা জলছাপ থাকা চলবে না।
৪. ভিডিও মোশন: ভিডিওর জন্য সিনেমাটিক ক্যামেরা মুভমেন্টের বর্ণনা দাও।
৫. স্টাইল: পেশাদার, ক্লিন এবং হাই-ফিডেলিটি কম্পোজিশন।

আউটপুটটি অবশ্যই নিম্নলিখিত ফরম্যাটে প্রদান করো, প্রতিটি অংশকে '---' দিয়ে আলাদা করে:

### CONCEPT ARCHITECT PROMPT ###
{এখানে কীওয়ার্ডগুলোর উপর ভিত্তি করে একটি পূর্ণাঙ্গ ভিজ্যুয়াল প্ল্যান দাও।}
---
### TECHNICAL DESCRIPTION ###
{উপরের প্ল্যানের উপর ভিত্তি করে ইমেজ জেনারেটরের জন্য একটি বিস্তারিত টেকনিক্যাল বর্ণনা দাও।}
---
### MOTION TYPE ###
{ভিডিওর জন্য একটি মোশন টাইপ উল্লেখ করো, যেমন: slow zoom-in, dramatic pan-right, orbital shot।}`;

    try {
      const response = await generateText(prompt1);
      const parts = response.split('---').map(part => part.trim());
      
      if (parts.length < 3) {
        throw new Error("API response did not contain all the required parts.");
      }

      const conceptPrompt = parts[0].replace('### CONCEPT ARCHITECT PROMPT ###', '').trim();
      const technicalDescription = parts[1].replace('### TECHNICAL DESCRIPTION ###', '').trim();
      const motionType = parts[2].replace('### MOTION TYPE ###', '').trim();

      const imagePrompt = `Style: MASTERPIECE, Cinematic, photorealistic, 8k, highly detailed.
Visual Concept: ${technicalDescription}
Constraints: STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO WATERMARKS, NO BORDERS, NO SIGNATURES, NO LOGOS, NO WRITING OF ANY KIND.`;
      
      const videoPrompt = `A cinematic slow-motion sequence of ${technicalDescription}, focusing on high-quality textures and lighting. Camera performs a ${motionType}, creating a professional atmosphere. No text or user interface elements in the frame.`;
      
      setGeneratedPrompts({
        concept: conceptPrompt,
        image: imagePrompt,
        video: videoPrompt,
      });

    } catch (err) {
      setError('প্রম্পট তৈরি করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const PromptOutput = ({ title, content, fieldId }: { title: string, content: string, fieldId: string }) => (
    <div className="bg-[#0d1117] border border-gray-700 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-gray-200">{title}</h4>
        <button onClick={() => handleCopy(content, fieldId)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          {copiedField === fieldId ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          {copiedField === fieldId ? 'কপি হয়েছে' : 'কপি করুন'}
        </button>
      </div>
      <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans bg-gray-900/50 p-3 rounded">{content}</pre>
    </div>
  );

  return (
    <div>
      <ToolHeader
        icon={BrainCircuit}
        title="কনসেপ্ট আর্কিটেক্ট"
        description="কীওয়ার্ড থেকে ভিজ্যুয়াল কনসেপ্ট এবং ইমেজ/ভিডিও প্রম্পট তৈরি করুন।"
      />
      <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-6">
        <div>
          <label htmlFor="keywords" className="block text-lg font-medium text-gray-300 mb-2">আপনার কীওয়ার্ড লিখুন</label>
          <textarea
            id="keywords"
            rows={3}
            className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 transition"
            placeholder="যেমন: gift, love, security, success..."
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>
        {error && <p className="text-red-400 text-center">{error}</p>}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'জেনারেট হচ্ছে...' : 'জেনারেট করুন'}
        </button>
      </div>

      {(isLoading || generatedPrompts) && (
        <div className="mt-8">
          {isLoading ? <Loader /> : generatedPrompts && (
            <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-4 animate-fade-in">
              <h3 className="text-xl font-bold text-gray-200 text-center mb-4">জেনারেটেড প্রম্পট</h3>
              <PromptOutput title="১. কনসেপ্ট আর্কিটেক্ট প্রম্পট (Gemini 3 Flash)" content={generatedPrompts.concept} fieldId="concept" />
              <PromptOutput title="২. ইমেজ জেনারেশন প্রম্পট (Gemini 2.5 Flash Image)" content={generatedPrompts.image} fieldId="image" />
              <PromptOutput title="৩. ভিডিও জেনারেশন প্রম্পট (Veo Optimized)" content={generatedPrompts.video} fieldId="video" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConceptArchitect;
