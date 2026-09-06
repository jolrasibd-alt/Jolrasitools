
import React from 'react';
import { Bot, Zap } from 'lucide-react';

const WelcomeScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Bot className="w-24 h-24 text-indigo-400 mb-6 animate-float" />
      <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-500">
        Ecomnexora-এ স্বাগতম
      </h1>
      <p className="text-xl text-gray-400 max-w-2xl">
        আপনার ই-কমার্স ব্যবসাকে পরবর্তী স্তরে নিয়ে যেতে বাম পাশের মেনু থেকে একটি টুল বেছে নিন। পোস্ট তৈরি থেকে শুরু করে বিজ্ঞাপন ডিজাইন পর্যন্ত, সবকিছু এখন এক ক্লিকে সম্ভব।
      </p>
      <div className="mt-8 flex items-center gap-2 text-gray-500">
        <Zap size={20} />
        <span>Gemini AI দ্বারা চালিত</span>
      </div>
    </div>
  );
};

export default WelcomeScreen;