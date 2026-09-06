
import React, { useState } from 'react';
import { Sparkles, Download } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import ImageUploader from '../components/ImageUploader';
import { FileWithPreview } from '../types';
import { generateImageFromImagesAndText } from '../services/geminiService';
import Loader from '../components/Loader';

const VirtualTryOn: React.FC = () => {
    const [modelFiles, setModelFiles] = useState<FileWithPreview[]>([]);
    const [garmentFiles, setGarmentFiles] = useState<FileWithPreview[]>([]);
    const [resultImage, setResultImage] = useState<string|null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if(modelFiles.length === 0 || garmentFiles.length === 0) {
            setError('অনুগ্রহ করে মডেল এবং পোশাকের ছবি আপলোড করুন।');
            return;
        }
        setError('');
        setIsLoading(true);
        setResultImage(null);

        const prompt = `ভার্চুয়াল ট্রাই-অন সম্পাদন করুন। আপনাকে একটি মডেলের ছবি এবং একটি পোশাকের ছবি দেওয়া হয়েছে। এই দুটি ছবি ব্যবহার করে একটি নতুন বাস্তবসম্মত ছবি তৈরি করুন, যেখানে মডেলকে ওই পোশাকটি পরা অবস্থায় দেখা যাবে।
গুরুত্বপূর্ণ নির্দেশ: মডেলের আসল পোজ, মুখ এবং শারীরিক গঠন অপরিবর্তিত রাখতে হবে। পোশাকটিকে বাস্তবসম্মতভাবে মডেলে স্থাপন করতে হবে এবং আলো ও ছায়ার সঠিক সমন্বয় করতে হবে। শুধুমাত্র পোশাকের ছবিটি থেকেই পোশাকটি ব্যবহার করতে হবে। আউটপুট অবশ্যই একটি নিখুঁত ছবি হতে হবে, কোনো অতিরিক্ত লেখা ছাড়া।`;

        try {
            const image = await generateImageFromImagesAndText(prompt, [modelFiles[0], garmentFiles[0]]);
            setResultImage(image);
        } catch (err) {
            setError('ট্রাই-অন করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleDownload = () => {
        if (resultImage) {
            const link = document.createElement('a');
            link.href = resultImage;
            link.download = 'virtual-try-on.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div>
            <ToolHeader
                icon={Sparkles}
                title="ভার্চুয়াল ট্রাই-অন"
                description="মডেলের উপর ভার্চুয়ালি পোশাক পরিয়ে দেখুন।"
            />
            <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ImageUploader files={modelFiles} setFiles={setModelFiles} label="মডেলের ছবি" />
                    <ImageUploader files={garmentFiles} setFiles={setGarmentFiles} label="পোশাকের ছবি" />
                </div>
                 {error && <p className="text-red-400 text-center">{error}</p>}
                <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20">
                    {isLoading ? "প্রসেস হচ্ছে..." : "ভার্চুয়াল ট্রাই-অন করুন"}
                </button>
                <div className="w-full aspect-square bg-[#0d1117] border border-gray-700 rounded-lg flex items-center justify-center relative group">
                    {isLoading && <Loader />}
                    {resultImage && (
                        <>
                            <img src={resultImage} alt="try on result" className="w-full h-full object-contain rounded-lg"/>
                            <button onClick={handleDownload} className="absolute bottom-4 right-4 flex items-center gap-1.5 text-sm bg-black/60 hover:bg-black/80 text-white font-medium py-1.5 px-3 rounded-full transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100">
                                <Download size={14} />
                                <span>ডাউনলোড</span>
                            </button>
                        </>
                    )}
                    {!isLoading && !resultImage && <p className="text-gray-500">ফলাফল এখানে দেখানো হবে</p>}
                </div>
            </div>
        </div>
    )
}

export default VirtualTryOn;
