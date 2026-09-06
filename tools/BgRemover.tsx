
import React, { useState } from 'react';
import { Scissors, Download } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import ImageUploader from '../components/ImageUploader';
import { FileWithPreview } from '../types';
import { generateImageFromTextAndImage } from '../services/geminiService';
import Loader from '../components/Loader';

const BgRemover: React.FC = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (files.length === 0) {
      setError('অনুগ্রহ করে একটি ছবি আপলোড করুন।');
      return;
    }
    setError('');
    setIsLoading(true);
    setResultImage(null);

    const prompt = `পণ্যের ছবি থেকে ব্যাকগ্রাউন্ডটি নিখুঁতভাবে এবং সম্পূর্ণরূপে মুছে ফেলুন। এরপর মুছে ফেলা খালি জায়গায় একটি হালকা ধূসর (#f0f0f0) রঙ দিয়ে ভরাট করুন। চূড়ান্ত ছবিতে শুধুমাত্র মূল পণ্যটিই থাকবে, যা ব্যাকগ্রাউন্ড থেকে ত্রুটিহীনভাবে আলাদা করা হয়েছে। কোনো অতিরিক্ত লেখা বা ব্যাখ্যা যোগ করবেন না, শুধু ছবিটি দিন।`;

    try {
      const generatedImage = await generateImageFromTextAndImage(prompt, files[0]);
      setResultImage(generatedImage);
    } catch (err) {
      setError('ব্যাকগ্রাউন্ড মুছে ফেলতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `background-removed-${files[0]?.name || 'image'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  return (
    <div>
      <ToolHeader
        icon={Scissors}
        title="ব্যাকগ্রাউন্ড রিমুভার"
        description="ছবি থেকে নিখুঁতভাবে ব্যাকগ্রাউন্ড মুছে ফেলুন।"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-300 mb-2">ছবি আপলোড করুন</label>
            <ImageUploader files={files} setFiles={setFiles} maxFiles={1} label="পণ্যের ছবি" />
          </div>
          {error && <p className="text-red-400">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20"
          >
            {isLoading ? 'প্রসেস হচ্ছে...' : 'ব্যাকগ্রাউন্ড রিমুভ করুন'}
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl flex flex-col">
          <div className="w-full aspect-square bg-[#0d1117] border border-gray-700 rounded-lg flex items-center justify-center">
            {isLoading && <Loader message="ব্যাকগ্রাউন্ড সরানো হচ্ছে..." />}
            {!isLoading && resultImage && <img src={resultImage} alt="Background removed" className="w-full h-full object-contain rounded-lg" />}
            {!isLoading && !resultImage && <p className="text-gray-500">ফলাফল এখানে দেখানো হবে...</p>}
          </div>
           {resultImage && !isLoading && (
              <button onClick={handleDownload} className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-medium py-2.5 px-3 rounded-lg transition-colors">
                <Download size={16} />
                <span>ডাউনলোড করুন</span>
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default BgRemover;
