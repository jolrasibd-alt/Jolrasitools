
import React, { useState } from 'react';
import Loader from '../components/Loader';
import { generateImageFromText } from '../services/geminiService';
import { Download } from 'lucide-react';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

const AiFashionStudio: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        setError('');
        setIsLoading(true);
        setImageUrl(null);

        try {
            const result = await generateImageFromText(prompt, aspectRatio);
            setImageUrl(result);
        } catch (err) {
            setError('Failed to generate image. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (imageUrl) {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `ai-generated-image.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-fuchsia-500">
                AI Content Studio
            </h1>
            <p className="text-lg text-gray-400 mt-2 mb-10">
                আপনার মনের কথা Prompt-এ লিখুন, আর দেখুন জাদুর মত ছবি ও পোস্ট তৈরি হয়ে গেছে।
            </p>
            
            <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl text-left">
                <h2 className="text-2xl font-semibold text-purple-300 mb-6 text-center">Image from Prompt</h2>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-grow">
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-400 mb-1">Enter your prompt</label>
                        <textarea
                            id="prompt"
                            rows={3}
                            className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500"
                            placeholder="যেমন: একটি বিড়াল স্কেটবোর্ড চালাচ্ছে..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-400 mb-1">Aspect Ratio</label>
                        <select
                            id="aspectRatio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            className="w-full sm:w-auto h-full bg-[#0d1117] border border-gray-700 rounded-lg py-3 px-4 text-gray-200 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="1:1">1:1</option>
                            <option value="16:9">16:9</option>
                            <option value="9:16">9:16</option>
                            <option value="4:3">4:3</option>
                            <option value="3:4">3:4</option>
                        </select>
                    </div>
                </div>
                
                {error && <p className="text-red-400 mb-4 text-center">{error}</p>}
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Generating...' : 'Generate Image'}
                </button>
            </div>
            
            <div className="mt-8 bg-[#161b22] border border-gray-800 p-4 rounded-xl min-h-[400px] flex items-center justify-center relative group">
                {isLoading ? <Loader message="Generating your image..." /> :
                 imageUrl ? (
                     <>
                        <img src={imageUrl} alt="Generated" className="max-w-full max-h-[500px] rounded-lg" />
                        <button onClick={handleDownload} className="absolute top-4 right-4 flex items-center gap-1.5 text-sm bg-black/60 hover:bg-black/80 text-white font-medium py-1.5 px-3 rounded-full transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100">
                            <Download size={14} />
                            <span>Download</span>
                        </button>
                     </>
                 ) :
                 <p className="text-gray-500">Your generated image will appear here.</p>
                }
            </div>
        </div>
    );
};

export default AiFashionStudio;
