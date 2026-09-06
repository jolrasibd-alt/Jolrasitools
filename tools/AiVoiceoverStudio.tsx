
import React, { useState, useRef } from 'react';
import { AudioLines, Wand2, Download, Volume2, Copy, Check } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import { generateAdStrategy, generateSpeech } from '../services/geminiService';
import Loader from '../components/Loader';
import ImageUploader from '../components/ImageUploader';
import { FileWithPreview } from '../types';

// Audio helper functions
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / 1;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

const createWavBlob = (base64Audio: string): Blob => {
    const pcmData = decode(base64Audio);
    const numChannels = 1;
    const sampleRate = 24000;
    const bitsPerSample = 16;
    const dataLength = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    for (let i = 0; i < dataLength; i++) {
      view.setUint8(44 + i, pcmData[i]);
    }
    return new Blob([view], { type: 'audio/wav' });
};

const voiceOptions = [
    { id: 'standard_female', name: 'সাধারণ মহিলা', voice: 'Kore', dialectPrompt: 'উচ্চারণটি হবে একদম সাধারণ, কথ্য এবং আকর্ষণীয় বাংলাদেশী ভঙ্গিতে। বলুন: ' },
    { id: 'standard_male', name: 'সাধারণ পুরুষ', voice: 'Puck', dialectPrompt: 'উচ্চারণটি হবে একদম সাধারণ, কথ্য এবং আকর্ষণীয় বাংলাদেশী ভঙ্গিতে। বলুন: ' },
    { id: 'viral_female', name: 'ভাইরাল কণ্ঠ (মহিলা)', voice: 'Kore', dialectPrompt: 'খুবই ট্রেন্ডি, ভাইরাল এবং উদ্যমী ভঙ্গিতে বলুন: ' },
    { id: 'viral_male', name: 'ভাইরাল কণ্ঠ (পুরুষ)', voice: 'Puck', dialectPrompt: 'খুবই ট্রেন্ডি, ভাইরাল এবং উদ্যমী ভঙ্গিতে বলুন: ' },
];


const AiVoiceoverStudio: React.FC = () => {
    const [productDesc, setProductDesc] = useState('');
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [script, setScript] = useState('');
    const [isScriptLoading, setIsScriptLoading] = useState(false);
    const [isScriptCopied, setIsScriptCopied] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState(voiceOptions[0]);
    const [generatedAudioB64, setGeneratedAudioB64] = useState<string | null>(null);
    const [isVoiceLoading, setIsVoiceLoading] = useState(false);
    const [error, setError] = useState('');
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const handleGenerateScript = async () => {
        if (!productDesc.trim() && files.length === 0) {
          setError('অনুগ্রহ করে পণ্যের বর্ণনা বা ছবি দিন।');
          return;
        }
        setError('');
        setIsScriptLoading(true);
        setScript('');
        setGeneratedAudioB64(null);

        const prompt = `আপনি বাংলাদেশের এক নম্বর ভাইরাল মার্কেটিং স্ক্রিপ্ট রাইটার। আপনার লেখাগুলো সাধারণ মানুষের মুখের ভাষার মতো, যা শুনেই মানুষ পণ্যের প্রেমে পড়ে যায় এবং কিনতে আগ্রহী হয়। আপনার প্রধান কাজ হলো প্রদত্ত পণ্যের তথ্য ব্যবহার করে একটি আকর্ষণীয়, কথ্য এবং ভাইরাল হওয়ার মতো ভয়েসওভার স্ক্রিপ্ট তৈরি করা।

**স্ক্রিপ্ট তৈরির অবশ্য পালনীয় নিয়মাবলী:**

1.  **আকর্ষণীয় শুরু (Hook):** স্ক্রিপ্টের শুরুটা হতে হবে এমন কিছু দিয়ে যা মানুষ শুনেই চমকে উঠবে এবং মনোযোগ দেবে। যেমন: "ভাই দাড়ান...", "আচ্ছা Wait...", "কি ভাই, ক্ষুধা লাগছে?", "שুনলাম আপনি নাকি..."
2.  **কথ্য ভাষা:** একদম সাধারণ মানুষের মুখের ভাষা ব্যবহার করুন। জটিল বা সাধু ভাষা পুরোপুরি পরিহার্য।
3.  **গল্পের ভঙ্গি:** পণ্যের গুণগান না করে, একটি ছোট গল্প বা relatable পরিস্থিতি তৈরি করুন যেখানে পণ্যটি একটি সমাধান হিসেবে আসে।
4.  **সমস্যা ও সমাধান:** প্রথমে দর্শকের একটি সাধারণ সমস্যা তুলে ধরুন এবং পরে আপনার পণ্যকে সেই সমস্যার জাদুকরী সমাধান হিসেবে উপস্থাপন করুন।
5.  **জরুরি অনুভূতি (Urgency):** শেষে একটি জরুরি ভাব তৈরি করুন। যেমন: "স্টক কিন্তু সীমিত!", "অফারটি শুধুমাত্র আজকের জন্য!", "পরে আবার পস্তায়েন না কিন্তু!"
6.  **শুদ্ধিকরণ ও সংখ্যা:** স্ক্রিপ্টের বিরামচিহ্ন (দাঁড়ি, কমা) সঠিক রাখুন এবং যেকোনো সংখ্যাকে বাংলা কথায় লিখুন (যেমন: ৫০০ কে 'পাঁচশ')।
7.  **চূড়ান্ত নির্দেশ:** কোনো প্রকার ভূমিকা, ব্যাখ্যা বা অতিরিক্ত কথা যোগ করবেন না। শুধুমাত্র চূড়ান্ত, সম্পূর্ণ এবং শুদ্ধ করা স্ক্রিপ্টটি প্রদান করুন।

**অনুপ্রেরণার জন্য কিছু উদাহরণ:**

**উদাহরণ ১ (ইনভেস্টিং):**
"আচ্ছা Wait ছোট্ট একটা ইনভেস্টিং ফ্যাট শুনে যান , ধরুন আপনি ২০ বছর বয়সে ১০ হাজার টাকা ইনভেস্ট করেছেন... ...তাহলে আর দেরি কেন আমাদের সাথে যোগাযোগ করতে হোয়াটসঅ্যাপে ক্লিক করতে পারেন অথবা আমাদের ওয়েবসাইটটা ভিজিট করে students রিভিউ দেখতে পারেন।"

**উদাহরণ ২ (অনলাইন কোর্স):**
"ভাই দাড়ান , ঘরে বইসা অনলাইনে ডলার কামনোর চিন্তা কমবেশি সবাই করে। পারেনা কেন জানেন ? ... ...কোর্স এর বিস্তারিত ক্যাপশনে দেয়া আছে। আমাদের সীট সংখ্যা লিমিটেড। দ্রূত স্ক্রিনে দেখানো নাম্বারে কল কইরা ফালান অথবা নিচের গেট অফার বাটনে ক্লিক করে কোর্সএ জয়েন করেন। ধন্যবাদ।"

**উদাহরণ ৩ (হোস্টিং):**
"ভাই দাড়ান , সারাদিনভর যে অভিযোগ করেন সেল নাই আর অন্যদিকে যে আপনার ওয়েব সাইটে স্পিড নাই সেই দিকে কি খেয়াল আছে ? ... ...বিশ্বাস না হলে নিচের Get Offer বাটনে ক্লিক কইরাই দেখেন একবার।"

**উদাহরণ ৪ (হেলথ প্রোডাক্ট):**
"এই রমজানে শুনলাম আপনি ওজন কামনোর প্লান করতেছেন ? এই প্লান তো অনেক করলেন কাজ হইছে কতদূর ? ... ...আর এদিক সেদিক না তাকায়া নিচের Send Message বাটনে ক্লিক করে দ্রূত অর্ডার করে ফেলেন। স্টকে কিন্তু খুব বেশি নাই , পরে আবার পস্তায়েন না কিন্তু।"

এবার, নিচের পণ্যের তথ্যের উপর ভিত্তি করে উপরের স্টাইল ও নিয়মাবলী অনুসরণ করে একটি নতুন, ইউনিক এবং ভাইরাল স্ক্রিপ্ট তৈরি করুন।

**পণ্যের তথ্য:**
---
${productDesc}
---`;
        
        try {
          const generatedScript = await generateAdStrategy(prompt, files.length > 0 ? files[0] : undefined);
          setScript(generatedScript);
        } catch (err) {
          setError('স্ক্রিপ্ট তৈরি করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
          console.error(err);
        } finally {
          setIsScriptLoading(false);
        }
    };
    
    const handleGenerateVoiceover = async () => {
        if (!script.trim()) {
            setError('অনুগ্রহ করে প্রথমে একটি স্ক্রিপ্ট জেনারেট করুন বা লিখুন।');
            return;
        }
        setError('');
        setIsVoiceLoading(true);

        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        try {
            const finalPrompt = selectedVoice.dialectPrompt + script;
            const base64Audio = await generateSpeech(finalPrompt, selectedVoice.voice as 'Kore' | 'Puck');
            setGeneratedAudioB64(base64Audio);

            const audioBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start();
            audioSourceRef.current = source;
        } catch (err) {
            setError('ভয়েসওভার তৈরি করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
            console.error(err);
        } finally {
            setIsVoiceLoading(false);
        }
    };

    const handleCopyScript = () => {
        if (script) {
            navigator.clipboard.writeText(script);
            setIsScriptCopied(true);
            setTimeout(() => setIsScriptCopied(false), 2000);
        }
    };

    const handleDownloadAudio = () => {
        if (!generatedAudioB64) return;
        const wavBlob = createWavBlob(generatedAudioB64);
        const url = URL.createObjectURL(wavBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'ai-voiceover.wav';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <ToolHeader
                icon={AudioLines}
                title="AI ভয়েসওভার স্টুডিও"
                description="আপনার পণ্যের জন্য স্বয়ংক্রিয়ভাবে স্ক্রিপ্ট তৈরি ও ভয়েসওভার জেনারেট করুন।"
            />
            <div className="space-y-8">
                {/* Step 1: Input */}
                <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-4">
                    <h3 className="text-xl font-semibold text-gray-200">১. পণ্যের তথ্য দিন</h3>
                    <textarea
                        rows={4}
                        className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 transition"
                        placeholder="আপনার পণ্যের একটি বিস্তারিত বর্ণনা দিন..."
                        value={productDesc}
                        onChange={(e) => setProductDesc(e.target.value)}
                    />
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-400">অথবা</span>
                        <div className="flex-grow border-t border-gray-600"></div>
                    </div>
                    <ImageUploader files={files} setFiles={setFiles} maxFiles={1} label="পণ্যের ছবি আপলোড করুন" />
                    <button onClick={handleGenerateScript} disabled={isScriptLoading} className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        {isScriptLoading ? "জেনারেট হচ্ছে..." : "জেনারেট স্ক্রিপ্ট"}
                    </button>
                </div>

                {/* Step 2: Script */}
                {(isScriptLoading || script) && (
                    <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-gray-200">২. জেনারেটেড স্ক্রিপ্ট</h3>
                            {script && (
                                <button onClick={handleCopyScript} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                                    {isScriptCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                    {isScriptCopied ? 'কপি হয়েছে' : 'কপি করুন'}
                                </button>
                            )}
                        </div>
                        <div className="w-full min-h-[150px] bg-[#0d1117] border border-gray-700 rounded-lg p-3">
                           {isScriptLoading ? <Loader /> : (
                               <textarea 
                                  rows={6}
                                  className="w-full h-full bg-transparent text-gray-200 focus:outline-none resize-none"
                                  value={script}
                                  onChange={(e) => setScript(e.target.value)}
                               />
                           )}
                        </div>
                    </div>
                )}
                
                {/* Step 3: Voiceover Generation */}
                {script && !isScriptLoading && (
                     <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-6 animate-fade-in">
                        <h3 className="text-xl font-semibold text-gray-200">৩. ভয়েসওভার তৈরি করুন</h3>
                        <div>
                            <span className="text-gray-300 block mb-3">আপনার পছন্দের কণ্ঠস্বর ও ধরণ বেছে নিন:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {voiceOptions.map(option => (
                                    <label key={option.id} className={`p-3 rounded-lg cursor-pointer text-center transition-all border-2 ${selectedVoice.id === option.id ? 'bg-indigo-600/30 border-indigo-500' : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'}`}>
                                        <input 
                                            type="radio" 
                                            name="voice" 
                                            value={option.id} 
                                            checked={selectedVoice.id === option.id}
                                            onChange={() => setSelectedVoice(option)}
                                            className="sr-only"
                                        />
                                        <span className="font-medium text-white text-sm">{option.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleGenerateVoiceover} disabled={isVoiceLoading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-wait transition-colors">
                            <Wand2 size={18} />
                            {isVoiceLoading ? "জেনারেট হচ্ছে..." : "ভয়েসওভার জেনারেট করুন"}
                        </button>

                        {(isVoiceLoading || generatedAudioB64) && (
                            <div className="pt-2">
                                {isVoiceLoading ? <Loader message="ভয়েসওভার তৈরি হচ্ছে..."/> : (
                                    <div className="flex items-center justify-center gap-4 p-4 bg-[#0d1117] border border-gray-700 rounded-lg">
                                         <button onClick={handleGenerateVoiceover} className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white transition-colors" aria-label="Play Again">
                                            <Volume2 size={20} />
                                        </button>
                                        <p className="text-gray-300">জেনারেটেড ভয়েস শুনুন</p>
                                        <button onClick={handleDownloadAudio} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                                            <Download size={16} />
                                            <span>ডাউনলোড</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                     </div>
                )}
                {error && <p className="text-red-400 text-center bg-[#161b22] border border-red-900 p-4 rounded-xl">{error}</p>}
            </div>
        </div>
    );
};

export default AiVoiceoverStudio;