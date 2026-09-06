
import React, { useState } from 'react';
import { PersonStanding, Download } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import ImageUploader from '../components/ImageUploader';
import { FileWithPreview } from '../types';
import { generateImageFromTextAndImage } from '../services/geminiService';
import Loader from '../components/Loader';

const ModelFromGarment: React.FC = () => {
    const [garmentFiles, setGarmentFiles] = useState<FileWithPreview[]>([]);
    const [resultImage, setResultImage] = useState<string|null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if(garmentFiles.length === 0) {
            setError('অনুগ্রহ করে পোশাকের ছবি আপলোড করুন।');
            return;
        }
        setError('');
        setIsLoading(true);
        setResultImage(null);
        
        const prompt = `আপনি একজন বিশেষজ্ঞ এআই ফ্যাশন ভিজ্যুয়ালাইজার। আপনার কাজ হলো প্রদত্ত পোশাকটি পরিয়ে একজন পূর্ণাঙ্গ, বাস্তবসম্মত এবং পেশাদার ফ্যাশন মডেলের ছবি তৈরি করা।
গুরুত্বপূর্ণ নির্দেশাবলী:
১. পূর্ণাঙ্গ মডেল তৈরি: একটি সম্পূর্ণ এবং বাস্তবসম্মত মানব মডেল তৈরি করুন। পোশাকের স্টাইলের সাথে মানানসই মডেলের জাতি, চুল এবং বৈশিষ্ট্য বেছে নেওয়ার স্বাধীনতা আপনার রয়েছে।
২. পোশাক পরিধান: তৈরি করা মডেলকে অবশ্যই প্রদত্ত ছবিটি থেকে নেওয়া পোশাকটি পরানো থাকতে হবে।
৩. পোজ: মডেলকে একটি স্বাভাবিক এবং আত্মবিশ্বাসী ভঙ্গিতে দাঁড় করাতে হবে, যা ই-কমার্স সাইটের জন্য উপযুক্ত।
৪. ব্যাকগ্রাউন্ড: মডেলের পেছনে একটি পরিষ্কার, নিউট্রাল এবং পেশাদার স্টুডিও ব্যাকগ্রাউন্ড (হালকা ধূসর বা অফ-হোয়াইট) ব্যবহার করুন।
৫. ফোকাস ও গুণমান: পোশাকটি যেন মূল ফোকাসে থাকে এবং ছবিটি অবশ্যই হাই-কোয়ালিটি ও শার্প হতে হবে। আউটপুট শুধুমাত্র মডেলের ছবি হতে হবে।`;

        try {
            const image = await generateImageFromTextAndImage(prompt, garmentFiles[0]);
            setResultImage(image);
        } catch (err) {
            setError('মডেল তৈরি করতে ব্যর্থ।');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleDownload = () => {
        if (resultImage) {
            const link = document.createElement('a');
            link.href = resultImage;
            link.download = `model-from-garment.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    return (
        <div>
            <ToolHeader
                icon={PersonStanding}
                title="পোশাক থেকে মডেল"
                description="শুধুমাত্র পোশাকের ছবি থেকে মডেল তৈরি করুন।"
            />
            <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-6">
                <ImageUploader files={garmentFiles} setFiles={setGarmentFiles} label="পোশাকের ছবি" />
                {error && <p className="text-red-400 text-center">{error}</p>}
                <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20">
                    {isLoading ? "মডেল তৈরি হচ্ছে..." : "পোশাক থেকে মডেল তৈরি করুন"}
                </button>
                <div className="w-full aspect-square bg-[#0d1117] border border-gray-700 rounded-lg flex items-center justify-center relative group">
                    {isLoading && <Loader />}
                    {resultImage && (
                        <>
                            <img src={resultImage} alt="model from garment" className="w-full h-full object-contain rounded-lg"/>
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

export default ModelFromGarment;
