
import React, { useState } from 'react';
import { Megaphone, Users, Lightbulb, Target, FileText, Copy, Check } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import Loader from '../components/Loader';
import { generateAdStrategy } from '../services/geminiService';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useSettings } from '../context/SettingsContext';
import ImageUploader from '../components/ImageUploader';
import { FileWithPreview } from '../types';

interface AdStrategy {
    campaign_name: string;
    ad_copy: string;
    headline: string;
    primary_targeting: {
        location: string;
        age_range: string;
        gender: string;
        interests: string[];
    };
    visual_concept: string;
}

const AdCopyGenerator: React.FC = () => {
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [adStrategy, setAdStrategy] = useState<AdStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { settings } = useSettings();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerate = async () => {
    if (!description.trim() && files.length === 0) {
      setError('অনুগ্রহ করে পণ্যের বিবরণ বা ছবি দিন।');
      return;
    }
    setError('');
    setIsLoading(true);
    setAdStrategy(null);

    let businessInfo = '';
    if (settings.businessName) businessInfo += `Business Name: ${settings.businessName}\n`;
    if (settings.phone) businessInfo += `Phone Number: ${settings.phone}\n`;
    if (settings.facebookPage) businessInfo += `Facebook Page: ${settings.facebookPage}\n`;
    if (settings.website) businessInfo += `Website: ${settings.website}\n`;

    const prompt = `আপনি একজন বিশ্বমানের ফেসবুক অ্যাডস স্ট্র্যাটেজিস্ট এবং বাংলাদেশের ই-কমার্স বাজার সম্পর্কে আপনার গভীর জ্ঞান রয়েছে। আপনার কাজ হলো প্রদত্ত পণ্যের তথ্য (বিবরণ এবং/অথবা ছবি) এবং ব্যবসার তথ্যের উপর ভিত্তি করে একটি সম্পূর্ণ, উচ্চ-রূপান্তরযোগ্য ফেসবুক বিজ্ঞাপন প্রচারাভিযানের পরিকল্পনা তৈরি করা।

**ব্যবসার তথ্য:**
---
${businessInfo.trim() ? businessInfo : 'কোনো তথ্য দেওয়া হয়নি।'}
---

আপনার প্রতিক্রিয়া অবশ্যই একটি একক, বৈধ JSON অবজেক্ট হতে হবে, যেখানে নিম্নলিখিত গঠন থাকবে:
{
  "campaign_name": " [প্রচারাভিযানের জন্য একটি সৃজনশীল নাম]",
  "ad_copy": " [গল্প, আবেগপূর্ণ ভাষা, ইমোজি এবং বোল্ড করার জন্য মার্কডাউন ব্যবহার করে একটি আকর্ষণীয় এবং প্ররোচনামূলক বাংলা বিজ্ঞাপন কপি। এতে অবশ্যই প্রদত্ত ব্যবসার তথ্য ব্যবহার করে একটি শক্তিশালী কল-টু-অ্যাকশন অন্তর্ভুক্ত থাকতে হবে।]",
  "headline": " [একটি সংক্ষিপ্ত, আকর্ষণীয় এবং মনোযোগ আকর্ষণকারী বাংলা হেডলাইন।]",
  "primary_targeting": {
    "location": "Bangladesh",
    "age_range": "[যেমন: ১৮-৩৫]",
    "gender": "[যেমন: Women, Men, All]",
    "interests": [
      "[আগ্রহ ১]",
      "[আগ্রহ ২]",
      "[আগ্রহ ৩]"
    ]
  },
  "visual_concept": " [বিজ্ঞাপনের সৃজনশীল (ছবি বা ভিডিও) এর জন্য একটি বিস্তারিত বিবরণ। দৃশ্য, মেজাজ, রঙ এবং কী হওয়া উচিত তা বর্ণনা করুন। এটি একজন ফটোগ্রাফার বা ডিজাইনারের জন্য একটি নির্দেশিকা হওয়া উচিত।]"
}

JSON অবজেক্টের বাইরে কোনো অতিরিক্ত পাঠ্য, ব্যাখ্যা বা মার্কডাউন ফরম্যাটিং অন্তর্ভুক্ত করবেন না।`;

    try {
      const result = await generateAdStrategy(prompt, files[0]);
      const cleanedJson = result.replace(/```json\n?|```/g, '').trim();
      const parsedStrategy = JSON.parse(cleanedJson);
      setAdStrategy(parsedStrategy);
    } catch (err) {
      setError('ক্যাম্পেইন তৈরি করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderStrategy = () => {
    if (!adStrategy) return null;
    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-center text-indigo-400">{adStrategy.campaign_name}</h3>
            
            <div className="p-4 bg-gray-900/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="flex items-center gap-2 font-semibold text-lg text-indigo-400"><FileText size={20} />অ্যাড কপি</h4>
                    <button onClick={() => handleCopy(adStrategy.ad_copy, 'ad_copy')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                        {copiedField === 'ad_copy' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        {copiedField === 'ad_copy' ? 'কপি হয়েছে' : 'কপি'}
                    </button>
                </div>
                <MarkdownRenderer content={adStrategy.ad_copy} />
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
                 <div className="flex justify-between items-center mb-2">
                    <h4 className="flex items-center gap-2 font-semibold text-lg text-indigo-400"><Target size={20} />হেডলাইন</h4>
                    <button onClick={() => handleCopy(adStrategy.headline, 'headline')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                        {copiedField === 'headline' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        {copiedField === 'headline' ? 'কপি হয়েছে' : 'কপি'}
                    </button>
                </div>
                <p className="text-gray-200 text-lg font-medium">"{adStrategy.headline}"</p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
                <h4 className="flex items-center gap-2 font-semibold text-lg text-indigo-400 mb-2"><Users size={20} />টার্গেট অডিয়েন্স</h4>
                <div className="space-y-1 text-gray-300">
                    <p><strong>এলাকা:</strong> {adStrategy.primary_targeting.location}</p>
                    <p><strong>বয়স:</strong> {adStrategy.primary_targeting.age_range}</p>
                    <p><strong>লিঙ্গ:</strong> {adStrategy.primary_targeting.gender}</p>
                    <div>
                        <strong>আগ্রহ:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {adStrategy.primary_targeting.interests.map((interest, i) => (
                                <span key={i} className="bg-gray-700 text-indigo-300 text-xs font-medium px-2.5 py-1 rounded-full">{interest}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
                <h4 className="flex items-center gap-2 font-semibold text-lg text-indigo-400 mb-2"><Lightbulb size={20} />ভিজ্যুয়াল কনসেপ্ট</h4>
                <p className="text-gray-300">{adStrategy.visual_concept}</p>
            </div>
        </div>
    );
  }

  return (
    <div>
      <ToolHeader
        icon={Megaphone}
        title="অ্যাড ক্যাম্পেইন জেনারেটর"
        description="পণ্যের তথ্য বা ছবি থেকে সম্পূর্ণ ফেসবুক অ্যাড ক্যাম্পেইন তৈরি করুন।"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-4 flex flex-col">
          <h3 className="text-lg font-medium text-gray-300">১. পণ্যের তথ্য দিন</h3>
          <textarea
            rows={8}
            className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="এখানে আপনার পণ্যের বিবরণ, বৈশিষ্ট্য এবং টার্গেট অডিয়েন্স সম্পর্কে লিখুন..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
          <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-600"></div>
              <span className="flex-shrink mx-4 text-gray-400">অথবা</span>
              <div className="flex-grow border-t border-gray-600"></div>
          </div>
          <ImageUploader files={files} setFiles={setFiles} maxFiles={1} label="পণ্যের ছবি আপলোড করুন" />
          {error && <p className="text-red-400 mt-2">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="mt-auto w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20"
          >
            {isLoading ? 'জেনারেট হচ্ছে...' : 'অ্যাড ক্যাম্পেইন জেনারেট করুন'}
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-gray-300 mb-4 text-center">জেনারেটেড ফেসবুক অ্যাড ক্যাম্পেইন</h3>
          <div className="w-full min-h-[300px] max-h-[70vh] overflow-y-auto bg-[#0d1117] border border-gray-700 rounded-lg p-4 text-gray-200">
            {isLoading ? <Loader /> : adStrategy ? renderStrategy() : <p className="text-gray-500 text-center pt-10">আপনার তৈরি করা অ্যাড ক্যাম্পেইন এখানে দেখানো হবে...</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdCopyGenerator;
