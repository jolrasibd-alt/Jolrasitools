
import React, { useState, useRef } from 'react';
import Loader from '../components/Loader';
import { generateViralPost } from '../services/geminiService';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { Copy, Check, Download } from 'lucide-react';

interface GeneratedPost {
  text: string;
  imageUrl: string;
}

const ViralPostGenerator: React.FC = () => {
  const [trendingPost, setTrendingPost] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };
  
  const handleChooseImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!trendingPost.trim()) {
      setError('অনুগ্রহ করে ভাইরাল পোস্টের লেখাটি পেস্ট করুন।');
      return;
    }
    setError('');
    setIsLoading(true);
    setGeneratedPost(null);
    setIsCopied(false);

    try {
      const result = await generateViralPost(trendingPost, imageFile || undefined);
      setGeneratedPost(result);
    } catch (err) {
      setError('পোস্ট তৈরি করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedPost?.text) {
      navigator.clipboard.writeText(generatedPost.text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedPost?.imageUrl) {
      const link = document.createElement('a');
      link.href = generatedPost.imageUrl;
      link.download = 'viral-post-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-500">
            Viral Post Generator
        </h1>
        <p className="text-lg text-gray-400 mt-2 mb-10">
            ট্রেন্ডিং পোস্ট দিন, নতুন লেখা আর ছবি সহ ইউনিক পোস্ট বুঝে নিন।
        </p>
      </div>
      
      <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl text-left space-y-6">
        <div>
          <label htmlFor="trendingPost" className="block text-sm font-medium text-gray-400 mb-1">
            Paste the trending post here
          </label>
          <textarea
            id="trendingPost"
            rows={6}
            className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-blue-500"
            placeholder="এখানে ভাইরাল পোস্টের লেখাটি পেস্ট করুন..."
            value={trendingPost}
            onChange={(e) => setTrendingPost(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Upload a related image (optional)
          </label>
          <div className="flex items-center gap-4">
            <button
                onClick={handleChooseImageClick}
                className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
                Choose Image
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
            />
            {imageFile && <span className="text-gray-400">{imageFile.name}</span>}
          </div>
        </div>

        {error && <p className="text-red-400 text-center">{error}</p>}
        
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'জেনারেট হচ্ছে...' : 'Generate Post'}
        </button>
      </div>
      
      {(isLoading || generatedPost) && (
        <div className="mt-8 bg-[#161b22] border border-gray-800 p-6 rounded-xl">
          {isLoading ? <Loader message="আপনার ইউনিক পোস্ট তৈরি হচ্ছে..." /> :
           generatedPost && (
             <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-200">আপনার নতুন পোস্ট</h3>
                  <button onClick={handleDownload} className="flex items-center gap-1.5 text-sm bg-gray-600 hover:bg-gray-500 text-white font-medium py-1.5 px-3 rounded-full transition-colors">
                    <Download size={14} />
                    <span>Download Image</span>
                  </button>
                </div>
                <img src={generatedPost.imageUrl} alt="Generated for post" className="max-w-full max-h-[500px] rounded-lg mx-auto" />
                <div className="bg-[#0d1117] border border-gray-700 rounded-lg p-4 relative">
                    <button onClick={handleCopy} className="absolute top-2 right-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-gray-800/50 p-1 rounded">
                         {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                         {isCopied ? 'Copied' : 'Copy'}
                    </button>
                    <MarkdownRenderer content={generatedPost.text} />
                </div>
             </div>
           )
          }
        </div>
      )}
    </div>
  );
};

export default ViralPostGenerator;
