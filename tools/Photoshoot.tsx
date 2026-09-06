
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileWithPreview } from '../types';
import { generateImageFromTextAndImage } from '../services/geminiService';
import Loader from '../components/Loader';
import { Download } from 'lucide-react';

const Photoshoot: React.FC = () => {
    const [file, setFile] = useState<FileWithPreview | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resultImages, setResultImages] = useState<string[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const currentFile = acceptedFiles[0];
            setFile(Object.assign(currentFile, {
                preview: URL.createObjectURL(currentFile)
            }));
            setResultImages([]);
            setError('');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
    });

    const handleGenerate = async () => {
        if (!file) {
            setError('অনুগ্রহ করে একটি পোশাকের ছবি আপলোড করুন।');
            return;
        }
        setError('');
        setIsLoading(true);
        setResultImages([]);

        const adStyles = [
            { id: 'minimalist', prompt: 'a clean, minimalist e-commerce ad banner. Use a solid light pastel background, elegant typography for a placeholder headline, and ensure the product is the hero. Professional studio lighting.' },
            { id: 'vibrant', prompt: 'a vibrant and bold social media ad. Use energetic color blocking, dynamic shapes, and a modern, eye-catching layout. Include a "New Arrival" text element.' },
            { id: 'lifestyle', prompt: 'a realistic lifestyle ad. Place the product in a natural, aspirational setting that matches its use, like a chic urban street or a cozy cafe. Ensure lighting and shadows are photorealistic.' },
            { id: 'luxury', prompt: 'a luxury-themed ad design. Use a dark, moody background, sophisticated serif fonts, and subtle elegant elements like a soft glow. Convey a premium, high-end feel.' },
            { id: 'promotional', prompt: 'a promotional sale banner. Use bright, attention-grabbing colors, include a bold "50% OFF" or "Special Offer" graphic, and leave clear space for a call-to-action button.' },
            { id: 'artistic', prompt: 'an artistic and creative ad composition. Use abstract background elements, interesting textures, or a collage style. The design should be unique and memorable.' },
        ];
        
        try {
            const generationPromises = adStyles.map(style => {
                const fullPrompt = `As a world-class AI graphic designer, create a stunning advertisement design for the provided product image. First, expertly remove the original background. Then, place the product onto a new, creative background based on this specific style: **${style.prompt}**. The final output must be a professional, high-quality ad banner. Do not include any text or explanation, only the image.`;
                return generateImageFromTextAndImage(fullPrompt, file);
            });

            const generatedImages = await Promise.all(generationPromises);
            setResultImages(generatedImages);

        } catch (err) {
            setError('ডিজাইন তৈরি করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = (imageUrl: string, index: number) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `ad-design-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-orange-400">অথবা</h2>
            <p className="text-lg text-gray-400 mt-1 mb-10">
                এক ক্লিকে ৬টি ভিন্ন বিজ্ঞাপনের ডিজাইন তৈরি করুন
            </p>

            <div className="bg-[#161b22] border border-gray-800 p-8 rounded-xl space-y-6 max-w-lg mx-auto">
                <h3 className="text-xl font-semibold text-gray-200">আপনার পোশাকের ছবি আপলোড করুন</h3>
                <div
                    {...getRootProps()}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-300 h-48 flex flex-col items-center justify-center ${
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

                {error && <p className="text-red-400 text-center">{error}</p>}

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !file}
                    className="w-full bg-gray-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'ডিজাইন তৈরি হচ্ছে...' : '৬টি ডিজাইন তৈরি করুন'}
                </button>
            </div>

            {(isLoading || resultImages.length > 0) && (
                <div className="mt-12">
                    <h3 className="text-2xl font-bold text-center text-gray-200 mb-6">আপনার বিজ্ঞাপনের ডিজাইন</h3>
                    {isLoading ? (
                        <div className="flex justify-center"><Loader message="আপনার ডিজাইনগুলো তৈরি হচ্ছে..." /></div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {resultImages.map((image, index) => (
                                <div key={index} className="bg-gray-800 p-2 rounded-lg aspect-square relative group">
                                    <img src={image} alt={`Generated design ${index + 1}`} className="w-full h-full object-contain rounded-md" />
                                    <button
                                        onClick={() => handleDownload(image, index)}
                                        className="absolute bottom-2 right-2 flex items-center gap-1 text-xs bg-black/60 hover:bg-black/80 text-white font-medium py-1 px-2 rounded-full transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
                                    >
                                        <Download size={12} />
                                        <span>ডাউনলোড</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Photoshoot;
