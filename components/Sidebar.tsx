
import React, { useState } from 'react';
import {
  Newspaper,
  Palette,
  Scissors,
  Sparkles,
  Camera,
  Clapperboard,
  Type,
  Film,
  Menu,
  X,
  Bot,
  PersonStanding,
  Lightbulb,
  Filter,
  Megaphone,
  Settings,
  Wand2,
  Flame,
  Eraser,
  AudioLines,
  BrainCircuit
} from 'lucide-react';
import { Tool, ToolId } from '../types';

interface SidebarProps {
  activeTool: ToolId | null;
  setActiveTool: (toolId: ToolId | null) => void;
  openSettings: () => void;
}

const tools: Tool[] = [
  { id: 'post-generator', name: 'পোস্ট জেনারেটর', description: 'সাধারণ পণ্যের বিবরণকে আকর্ষণীয় ফেসবুক পোস্টে রূপান্তর করুন।', icon: Newspaper },
  { id: 'ad-copy-generator', name: 'অ্যাড কপি জেনারেটর', description: 'পণ্যের বিবরণ থেকে আকর্ষণীয় বিজ্ঞাপন কপি তৈরি করুন।', icon: Megaphone },
  { id: 'viral-post-generator', name: 'ভাইরাল পোস্ট জেনারেটর', description: 'ট্রেন্ডিং পোস্ট থেকে নতুন লেখা ও ছবি সহ ইউনিক পোস্ট তৈরি করুন।', icon: Flame },
  { id: 'ai-voiceover-studio', name: 'AI ভয়েসওভার স্টুডিও', description: 'পণ্যের বর্ণনা থেকে ভয়েসওভার তৈরি করুন।', icon: AudioLines },
  { id: 'concept-architect', name: 'কনসেপ্ট আর্কিটেক্ট', description: 'কীওয়ার্ড থেকে ভিজ্যুয়াল কনসেপ্ট ও প্রম্পট তৈরি করুন।', icon: BrainCircuit },
  { id: 'ai-content-studio', name: 'AI কন্টেন্ট স্টুডিও', description: 'আপনার লেখা থেকে ছবি তৈরি করুন।', icon: Wand2 },
  { id: 'watermark-remover', name: 'ওয়াটারমার্ক রিমুভার', description: 'ছবি থেকে যেকোনো ওয়াটারমার্ক মুছে ফেলুন।', icon: Eraser },
  { id: 'garment-enhancer', name: 'পোশাকের ছবি এডিটর', description: 'সাধারণ পোশাকের ছবিকে অসাধারণ করে তুলুন।', icon: Palette },
  { id: 'photoshoot', name: 'প্রোডাক্ট ফটোশুট', description: 'সাধারণ পণ্যের ছবিকে পেশাদার ফটোশুটের ছবিতে রূপান্তর করুন।', icon: Camera },
  { id: 'promotional-post-generator', name: 'প্রচারমূলক পোস্ট জেনারেটর', description: 'পণ্যের বিবরণ থেকে প্রচারমূলক পোস্ট তৈরি করুন।', icon: Megaphone },
  { id: 'bg-remover', name: 'ব্যাকগ্রাউন্ড রিমুভার', description: 'ছবি থেকে নিখুঁতভাবে ব্যাকগ্রাউন্ড মুছে ফেলুন।', icon: Scissors },
  { id: 'virtual-try-on', name: 'ভার্চুয়াল ট্রাই-অন', description: 'মডেলের উপর ভার্চুয়ালি পোশাক পরিয়ে দেখুন।', icon: Sparkles },
  { id: 'model-from-garment', name: 'পোশাক থেকে মডেল', description: 'শুধুমাত্র পোশাকের ছবি থেকে মডেল তৈরি করুন।', icon: PersonStanding },
  { id: 'video-prompt-generator', name: 'ভিডিও প্রম্পট জেনারেটর', description: 'ফ্যাশন ভিডিওর জন্য সৃজনশীল আইডিয়া তৈরি করুন।', icon: Lightbulb },
  { id: 'ad-funnel-generator', name: 'অ্যাড ফানেল জেনারেটর', description: 'পণ্যের জন্য ফেসবুক অ্যাড ফানেল তৈরি করুন।', icon: Filter },
  { id: 'storyboard-generator', name: 'স্টোরিবোর্ড জেনারেটর', description: 'বিজ্ঞাপনের জন্য ৩টি ধাপের গল্প তৈরি করুন।', icon: Clapperboard },
  { id: 'subtitle-translator', name: 'সাবটাইটেল ট্রান্সলেটর', description: 'ভিডিওর সাবটাইটেল অনুবাদ করুন।', icon: Type },
  { id: 'video-script-generator', name: 'ভিডিও স্ক্রিপ্ট জেনারেটর', description: 'পণ্যের জন্য সম্পূর্ণ ভিডিও মার্কেটিং স্ক্রিপ্ট তৈরি করুন।', icon: Film },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTool, setActiveTool, openSettings }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToolClick = (toolId: ToolId) => {
    setActiveTool(toolId);
    setIsOpen(false); 
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#161b22] shadow-lg border-r border-gray-800">
      <div className="p-4 sm:p-6 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setActiveTool(null)}
        >
          <Bot className="w-8 h-8 text-indigo-400" />
          <h1 className="text-xl font-bold text-white">Ecomnexora</h1>
        </div>
        <button onClick={openSettings} className="text-gray-400 hover:text-white transition-colors" aria-label="Settings">
          <Settings className="w-6 h-6" />
        </button>
      </div>
      <nav className="flex-1 px-4 sm:px-2 py-4 space-y-2 overflow-y-auto">
        {tools.map((tool) => (
          <a
            key={tool.id}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleToolClick(tool.id);
            }}
            className={`flex items-center p-3 text-sm font-medium rounded-lg transition-colors duration-200 group ${
              activeTool === tool.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <tool.icon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="flex-1">{tool.name}</span>
          </a>
        ))}
      </nav>
    </div>
  );


  return (
    <>
      <button
        aria-label="Toggle Menu"
        className="fixed top-4 left-4 z-20 p-2 bg-gray-800 rounded-md lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-10 w-72 flex-shrink-0 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;