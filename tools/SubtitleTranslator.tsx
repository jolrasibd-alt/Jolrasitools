
import React, { useState, useCallback, useEffect } from 'react';
import { Type, Upload, Mic, Languages, Wand2, Copy, Check, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import ToolHeader from '../components/ToolHeader';
import Loader from '../components/Loader';
import { generateText } from '../services/geminiService';

const languages = [
    { code: 'auto', name: 'Auto-Detect Language' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
];

const SubtitleTranslator: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [srtContent, setSrtContent] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [translatedSrt, setTranslatedSrt] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleVideoDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  }, []);

  useEffect(() => {
    // Cleanup the object URL when the component unmounts or video changes
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleVideoDrop,
    accept: { 'video/*': [] },
    maxFiles: 1,
  });

  const handleTranslate = async () => {
    if (!srtContent.trim()) {
      setError('অনুগ্রহ করে আসল সাবটাইটেল পেস্ট করুন।');
      return;
    }
    setError('');
    setIsTranslating(true);
    setTranslatedSrt('');

    const sourceLangName = languages.find(l => l.code === sourceLanguage)?.name || 'the detected language';
    
    const prompt = sourceLanguage === 'auto' 
      ? `Detect the language of the following SRT content and then translate only the text portions to Bengali. It is crucial that you preserve the SRT formatting, including sequence numbers and timestamps, exactly as they are. Do not add any extra explanations.\n\nSRT Content:\n---\n${srtContent}\n---`
      : `You are an expert subtitle translator. Translate the text portions of the given SRT content from ${sourceLangName} to Bengali. It is crucial that you preserve the SRT formatting, including sequence numbers and timestamps, exactly as they are. Do not add any extra explanations.\n\nSRT Content:\n---\n${srtContent}\n---`;

    try {
      const result = await generateText(prompt);
      setTranslatedSrt(result);
    } catch (err) {
      setError('অনুবাদ করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };
  
  const handleGenerateSubtitle = () => {
    alert('এই ফিচারটি শীঘ্রই আসছে! আপাতত, অনুগ্রহ করে আপনার সাবটাইটেল নিচের বক্সে পেস্ট করুন।');
  }
  
  const handleCopy = () => {
    if (translatedSrt) {
      navigator.clipboard.writeText(translatedSrt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownloadSrt = () => {
    if (translatedSrt) {
      const blob = new Blob([translatedSrt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `translated_subtitles_bn.srt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div>
      <ToolHeader
        icon={Type}
        title="এআই সাবটাইটেল অনুবাদক"
        description="যেকোনো ভিডিও থেকে সাবটাইটেল তৈরি ও বাংলায় অনুবাদ করুন।"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Panel */}
        <div className="lg:col-span-2 bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-6 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2 rounded-lg">
                <Upload className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-200">আপনার ভিডিও সেটআপ করুন</h2>
          </div>

          {/* Step 1: Video Upload */}
          <div className="space-y-2">
            <label className="block text-md font-medium text-gray-300">১. ভিডিও আপলোড করুন</label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-300 ${
                isDragActive ? 'border-indigo-500 bg-gray-800' : 'border-gray-600 hover:border-indigo-500 hover:bg-gray-800/50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center text-gray-400">
                <Upload className="w-10 h-10 mb-3" />
                <p>
                  <span className="font-semibold text-indigo-400">একটি ফাইল আপলোড করুন</span> অথবা টেনে আনুন
                </p>
                {videoFile && <p className="text-sm text-gray-500 mt-2">{videoFile.name}</p>}
              </div>
            </div>
          </div>

          {/* Step 2: Original Subtitle */}
          <div className="space-y-2">
            <label className="block text-md font-medium text-gray-300">২. আসল সাবটাইটেল</label>
            <button
              onClick={handleGenerateSubtitle}
              disabled={!videoFile}
              className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Mic size={18} />
              ভিডিও থেকে সাবটাইটেল তৈরি করুন
            </button>
            <textarea
              rows={6}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500"
              placeholder="এখানে স্বয়ংক্রিয়ভাবে সাবটাইটেল জেনারেট হবে অথবা আপনি নিজে পেস্ট করতে পারেন..."
              value={srtContent}
              onChange={(e) => setSrtContent(e.target.value)}
            />
          </div>

          {/* Step 3: Original Language */}
          <div className="space-y-2">
             <label htmlFor="sourceLanguage" className="block text-md font-medium text-gray-300">৩. আসল ভাষা (ঐচ্ছিক)</label>
             <select 
                id="sourceLanguage"
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500"
            >
                {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
            </select>
          </div>
          
          {error && <p className="text-red-400 text-center">{error}</p>}
          
          <button
            onClick={handleTranslate}
            disabled={isTranslating || !srtContent}
            className="mt-auto w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20"
          >
            <Wand2 size={18} />
            {isTranslating ? 'অনুবাদ হচ্ছে...' : 'বাংলায় অনুবাদ করুন'}
          </button>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-3 space-y-6">
            {/* Video Player */}
            <div className="bg-[#161b22] border border-gray-800 p-4 rounded-xl aspect-video flex items-center justify-center">
                {videoSrc ? (
                    <video src={videoSrc} controls className="w-full h-full rounded-lg"></video>
                ) : (
                    <p className="text-gray-500">ফলাফল এখানে দেখানো হবে</p>
                )}
            </div>
            {/* Translated Subtitle */}
            <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl flex-grow flex flex-col">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/10 p-2 rounded-lg">
                           <Languages className="w-6 h-6 text-indigo-400" />
                       </div>
                       <h3 className="text-xl font-semibold text-gray-200">অনুবাদিত সাবটাইটেল</h3>
                    </div>
                    {translatedSrt && (
                        <div className="flex items-center gap-2">
                            <button onClick={handleCopy} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                                {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                {isCopied ? 'কপি হয়েছে' : 'কপি'}
                            </button>
                            <button onClick={handleDownloadSrt} className="flex items-center gap-1.5 text-sm bg-gray-600 hover:bg-gray-500 text-white font-medium py-1.5 px-3 rounded-full transition-colors">
                                <Download size={14} />
                                <span>.srt</span>
                            </button>
                        </div>
                    )}
                </div>
                 <div className="w-full flex-grow min-h-[200px] bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-gray-200 font-mono text-sm overflow-y-auto">
                    {isTranslating ? <Loader /> : translatedSrt ? <pre className="whitespace-pre-wrap">{translatedSrt}</pre> : <p className="text-gray-500 font-sans">অনুবাদিত সাবটাইটেল এখানে দেখানো হবে।</p>}
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SubtitleTranslator;
