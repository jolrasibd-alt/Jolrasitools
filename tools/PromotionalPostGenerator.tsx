
import React, { useState } from 'react';
import Loader from '../components/Loader';
import { generateText } from '../services/geminiService';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useSettings } from '../context/SettingsContext';
import { Copy, Check } from 'lucide-react';

const PromotionalPostGenerator: React.FC = () => {
  const [description, setDescription] = useState('');
  const [post, setPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { settings } = useSettings();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (post) {
      navigator.clipboard.writeText(post);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('অনুগ্রহ করে পণ্যের বিবরণ লিখুন।');
      return;
    }
    setError('');
    setIsLoading(true);
    setPost('');
    setIsCopied(false);

    let businessInfo = '';
    if (settings.businessName) businessInfo += `Business Name: ${settings.businessName}\n`;
    if (settings.phone) businessInfo += `Phone Number: ${settings.phone}\n`;
    if (settings.facebookPage) businessInfo += `Facebook Page: ${settings.facebookPage}\n`;
    if (settings.website) businessInfo += `Website: ${settings.website}\n`;

    let whatsappLink = '';
    if (settings.phone) {
        let phoneNumber = settings.phone.replace(/[^0-9+]/g, ''); // Keep only numbers and '+'
        if (phoneNumber.startsWith('+880')) {
            whatsappLink = `https://wa.me/${phoneNumber.substring(1)}`;
        } else if (phoneNumber.startsWith('880')) {
             whatsappLink = `https://wa.me/${phoneNumber}`;
        } else if (phoneNumber.startsWith('01') && phoneNumber.length === 11) {
            whatsappLink = `https://wa.me/880${phoneNumber.substring(1)}`;
        } else {
             whatsappLink = `https://wa.me/${phoneNumber}`;
        }
    }
    
    const ctaInstructions = [];
    if (settings.facebookPage) {
        ctaInstructions.push(`- ফেসবুক পেজ থাকলে এই লাইনটি ব্যবহার করুন: "👉 আমাদের [${settings.businessName || 'ফেসবুক পেজ'}](${settings.facebookPage}) পেজে মেসেজ দিন"`);
    }
    if (settings.website) {
        ctaInstructions.push(`- ওয়েবসাইট থাকলে এই লাইনটি ব্যবহার করুন: "🌐 সরাসরি [${settings.businessName || 'ওয়েবসাইট'}](${settings.website}) থেকে অর্ডার করুন"`);
    }
    if (settings.phone && whatsappLink) {
        ctaInstructions.push(`- ফোন নম্বর থাকলে এই লাইনটি ব্যবহার করুন: "📞 কল করুন সরাসরি: [${settings.phone}](${whatsappLink})"`);
    }

    const prompt = `আপনি বাংলাদেশের এক নম্বর ভাইরাল মার্কেটিং এক্সপার্ট এবং একজন জাদুকরী storyteller। আপনার লেখা ফেসবুক পোস্টগুলো এতটাই আকর্ষণীয় হয় যে মানুষ স্ক্রলিং থামিয়ে পড়তে বাধ্য হয় এবং কেনার জন্য পাগল হয়ে যায়।

আপনার কাজ হলো একটি সাধারণ পণ্যের বিবরণ এবং প্রদত্ত ব্যবসার তথ্যের উপর ভিত্তি করে একটিমাত্র, চোখ ধাঁধানো এবং সর্বোচ্চ শেয়ারযোগ্য বাংলা ফেসবুক পোস্টে রূপান্তরিত করা।

**ব্যবসার তথ্য:**
---
${businessInfo.trim() ? businessInfo : 'কোনো তথ্য দেওয়া হয়নি।'}
---

**পোস্ট তৈরির অবশ্য পালনীয় নিয়মাবলী:**

1.  **ভাইরাল হুক:** পোস্টের প্রথম লাইনটি এমন হতে হবে যা মানুষের মনে তীব্র কৌতূহল বা আবেগ তৈরি করে।
2.  **গল্পের ছোঁয়া:** পণ্যের বেনিফিটগুলো সরাসরি না বলে, একটি ছোট গল্প বা পরিস্থিতির মাধ্যমে তুলে ধরুন যা গ্রাহকের জীবনকে স্পর্শ করে।
3.  **আবেগঘন ভাষা:** এমন শব্দ ব্যবহার করুন যা গ্রাহকের অনুভূতিকে (যেমন: আনন্দ, আত্মবিশ্বাস, স্বস্তি, স্টাইলিশ অনুভব করা) জাগিয়ে তোলে।
4.  **মোবাইল-ফ্রেন্ডলি ফরম্যাটিং:** পোস্টটি ছোট ছোট প্যারাগ্রাফ, প্রচুর লাইন ব্রেক এবং আকর্ষণীয় ইমোজি (✨, 🔥, 🛍️, 💖) দিয়ে সাজান।
5.  **শক্তিশালী এবং প্রাসঙ্গিক কল-টু-অ্যাকশন (CTA):** শেষে একটি স্পষ্ট এবং জরুরি CTA সেকশন তৈরি করুন। যদি ব্যবসার তথ্য দেওয়া থাকে, তাহলে অবশ্যই নিচের ফরম্যাটগুলো ব্যবহার করুন:
    ${ctaInstructions.length > 0 ? ctaInstructions.join('\n    ') : 'একটি সাধারণ কল-টু-অ্যাকশন দিন।'}
    আপনি এই লাইনগুলো প্রয়োজন অনুযায়ী একত্রিত করে একটি সুন্দর CTA সেকশন তৈরি করতে পারেন।
6.  **কার্যকরী হ্যাশট্যাগ:** কমপক্ষে ৩-৫টি কার্যকরী এবং প্রাসঙ্গিক বাংলা হ্যাশট্যাগ (#নতুনকালেকশন #সেরাঅফার #স্টাইলটিপস) ব্যবহার করুন।
7.  **বোল্ড টেক্সট:** সবচেয়ে গুরুত্বপূর্ণ অফার বা শব্দকে মার্কডাউন ব্যবহার করে বোল্ড (**শব্দ**) করুন।
8.  **চূড়ান্ত নির্দেশ:** কোনো প্রকার ভূমিকা, স্টাইলের নাম, ব্যাখ্যা বা অতিরিক্ত কথা যোগ করবেন না। আউটপুট হিসেবে শুধুমাত্র চূড়ান্ত পোস্টটি প্রদান করুন।

পণ্যের বিবরণ নিচে দেওয়া হলো:
---
${description}
---
`;

    try {
      const result = await generateText(prompt);
      setPost(result);
    } catch (err) {
      setError('পোস্ট তৈরি করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="text-3xl font-bold text-orange-400">অথবা</h2>
      <p className="text-lg text-gray-400 mt-1 mb-10">
        আপনার পণ্যের জন্য আকর্ষণীয় ফেসবুক পোস্ট তৈরি করুন
      </p>

      <div className="bg-[#161b22] border border-gray-800 p-8 rounded-xl space-y-6">
        <h3 className="text-2xl font-bold text-gray-200">প্রচারমূলক পোস্ট জেনারেটর</h3>
        <p className="text-gray-400 -mt-4">আপনার পণ্যের বিবরণ দিন, আমরা সেটিকে আকর্ষণীয় ফেসবুক পোস্টে পরিণত করব।</p>
        
        <textarea
            id="description"
            rows={8}
            className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="এখানে আপনার পণ্যের বিবরণ লিখুন..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
        ></textarea>
        
        {error && <p className="text-red-400 text-center">{error}</p>}
        
        <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-gray-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            {isLoading ? 'জেনারেট হচ্ছে...' : 'পোস্ট তৈরি করুন'}
        </button>
      </div>

      {(isLoading || post) && (
        <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-200">আপনার জেনারেটেড পোস্ট</h3>
                {post && !isLoading && (
                    <button onClick={handleCopy} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                        {isCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        {isCopied ? 'কপি হয়েছে' : 'কপি করুন'}
                    </button>
                )}
            </div>
            <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl text-left">
                <div className="w-full min-h-[200px] max-h-[60vh] overflow-y-auto bg-[#0d1117] border border-gray-700 rounded-lg p-4 text-gray-200">
                    {isLoading ? <Loader /> : post ? <MarkdownRenderer content={post} /> : null}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PromotionalPostGenerator;
