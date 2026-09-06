import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileWithPreview } from '../types';
import { generateImageFromTextAndImage } from '../services/geminiService';
import Loader from '../components/Loader';
import { Download } from 'lucide-react';

const styles = [
  { id: 'studio', name: 'স্টুডিও', description: 'পোশাদার, পরিষ্কার স্টুডিও লুক এবং নিয়ন্ত্রিত আলো।', prompt: 'a professional, clean studio look with controlled lighting and a neutral gray background. The focus should be entirely on the garment.' },
  { id: 'lifestyle', name: 'লাইফস্টাইল', description: 'পোশাকটি বাস্তব জীবনের আকর্ষণীয় পরিবেশে দেখানো হবে।', prompt: 'a realistic and attractive real-life environment. For example, if it is a dress, show it in a beautiful urban street setting or a chic cafe. Make it look natural.' },
  { id: 'minimalist', name: 'মিনিমালিস্ট', description: 'পণ্যকে হাইলাইট করার জন্য একটি সাধারণ, মিনিমালিস্ট ব্যাকগ্রাউন্ড।', prompt: 'a simple, minimalist background with a single solid pastel color or a subtle texture. The composition should be clean and emphasize the garment.' },
  { id: 'festival', name: 'উৎসব', description: 'বিশেষ অনুষ্ঠানের জন্য একটি উৎসবের ব্যাকগ্রাউন্ড।', prompt: 'a festive background suitable for special occasions like Eid or weddings. Use elegant decorations, soft lighting, and a celebratory mood.' },
  { id: 'vibrant-ecommerce', name: 'প্রাণবন্ত ই-কমার্স', description: 'প্রাণবন্ত এবং চোখ ধাঁধানো একটি ই-কমার্স স্টাইল।', prompt: 'a vibrant and eye-catching e-commerce style. Use bold color blocks, dynamic shapes, and a modern, energetic feel to make the product pop.' },
];

const GarmentEnhancerTool: React.FC = () => {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(styles[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const currentFile = acceptedFiles[0];
      setFile(Object.assign(currentFile, {
        preview: URL.createObjectURL(currentFile)
      }));
      setResultImage(null);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const handleGenerate = async (styleToUse: typeof selectedStyle) => {
    if (!file) {
      setError('অনুগ্রহ করে একটি পোশাকের ছবি আপলোড করুন।');
      return;
    }
    setError('');
    setIsLoading(true);
    setResultImage(null);

    const prompt = `As a world-class AI fashion photographer, your task is to take the provided garment image, expertly remove its original background, and then place it onto a new, hyper-realistic background based on the selected style. The final output must be a professional, high-quality e-commerce product photo that looks like it was taken with a DSLR camera. Ensure the lighting, shadows, and textures on the garment blend seamlessly with the new environment. The style is: '${styleToUse.prompt}'. Output only the final image, with no text or explanation.`;

    try {
      const generatedImage = await generateImageFromTextAndImage(prompt, file);
      setResultImage(generatedImage);
// FIX: Added curly braces to the catch block to correctly handle the error and prevent syntax issues.
    } catch (err) {
      setError('ছবি তৈরি করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRandomStyle = () => {
    const randomIndex = Math.floor(Math.random() * styles.length);
    const randomStyle = styles[randomIndex];
    setSelectedStyle(randomStyle);
    handleGenerate(randomStyle);
  }
  
  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `enhanced-garment-${selectedStyle.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-500">
            পোশাকের ছবি এডিটর
        </h1>
        <p className="text-lg text-gray-400 mt-2">
            আপনার ই-কমার্স ব্যবসার জন্য সাধারণ পোশাকের ছবিকে অসাধারণ করে তুলুন।
        </p>
      </div>

      <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Uploader */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-200">১. আপনার পোশাকের ছবি আপলোড করুন</h2>
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-300 h-64 flex items-center justify-center ${
                isDragActive ? 'border-orange-500 bg-gray-800' : 'border-gray-600 hover:border-orange-500 hover:bg-gray-800/50'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                 <img src={file.preview} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />
              ) : (
                <div className="text-gray-400">
                  <p className="font-semibold text-orange-400">এখান থেকে একটি ফাইল বেছে নিন</p>
                  <p className="text-sm">অথবা ছবিটি এখানে টেনে আনুন</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column: Styles */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-200">২. আপনার পছন্দের স্টাইল বেছে নিন</h2>
            <div className="space-y-3">
              {styles.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 border-2 ${selectedStyle.id === style.id ? 'bg-gray-700/50 border-orange-500' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}
                >
                  <p className="font-semibold text-white">{style.name}</p>
                  <p className="text-sm text-gray-400">{style.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {error && <p className="text-red-400 text-center">{error}</p>}
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <button
              onClick={() => handleGenerate(selectedStyle)}
              disabled={isLoading || !file}
              className="bg-gray-300 text-black font-bold py-3 px-8 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ছবি তৈরি করুন
            </button>
            <button
              onClick={handleRandomStyle}
              disabled={isLoading || !file}
              className="bg-gray-700 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              এলোমেলো স্টাইল
            </button>
        </div>
      </div>
      
      {/* Output Section */}
      {(isLoading || resultImage) && (
        <div className="mt-8 bg-[#161b22] border border-gray-800 p-6 rounded-xl">
           <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-200">আপনার নতুন ছবি</h3>
            {resultImage && !isLoading && (
              <button onClick={handleDownload} className="flex items-center gap-1.5 text-sm bg-gray-600 hover:bg-gray-500 text-white font-medium py-1.5 px-3 rounded-full transition-colors">
                <Download size={14} />
                <span>ডাউনলোড</span>
              </button>
            )}
           </div>
           <div className="w-full aspect-square bg-[#0d1117] border border-gray-700 rounded-lg flex items-center justify-center max-w-lg mx-auto">
                {isLoading ? <Loader message="আপনার ছবি তৈরি হচ্ছে..." /> :
                 resultImage && <img src={resultImage} alt="Generated result" className="w-full h-full object-contain rounded-lg" />
                }
           </div>
        </div>
      )}
    </div>
  );
};

export default GarmentEnhancerTool;
