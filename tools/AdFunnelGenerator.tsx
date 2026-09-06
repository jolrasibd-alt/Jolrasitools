
import React, { useState, useRef } from 'react';
import { Filter, Users, Goal, Camera, FileText, Wand2, Download, Volume2, Copy, Check } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import { generateAdStrategy, generateSpeech } from '../services/geminiService';
import Loader from '../components/Loader';
import { useSettings } from '../context/SettingsContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import ImageUploader from '../components/ImageUploader';
import { FileWithPreview } from '../types';

// Interfaces
interface FunnelStage {
  stage_name: string;
  objective: string;
  target_audience: {
    description: string;
    demographics: string;
    interests: string[];
  };
  ad_format: string;
  visual_concept: string;
  headline: string;
  ad_copy: string;
  call_to_action: string;
  content_details: {
    visual_instructions: string;
    script: string;
  };
  generated_audio_b64?: string;
}

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


const AdFunnelGenerator: React.FC = () => {
  const [productDesc, setProductDesc] = useState('');
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [result, setResult] = useState<FunnelStage[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { settings } = useSettings();
  const [generatingStates, setGeneratingStates] = useState<{ audio: { [key: number]: boolean } }>({ audio: {} });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerate = async () => {
    if (!productDesc.trim() && files.length === 0) {
      setError('অনুগ্রহ করে পণ্যের বর্ণনা বা ছবি দিন।');
      return;
    }
    setError('');
    setIsLoading(true);
    setResult(null);
    
    let businessInfo = '';
    if (settings.businessName) businessInfo += `Business Name: ${settings.businessName}\n`;
    if (settings.phone) businessInfo += `Phone Number: ${settings.phone}\n`;
    if (settings.facebookPage) businessInfo += `Facebook Page: ${settings.facebookPage}\n`;
    if (settings.website) businessInfo += `Website: ${settings.website}\n`;

    const prompt = `আপনি একজন বিশ্বমানের ফেসবুক অ্যাডস স্ট্র্যাটেজিস্ট এবং বাংলাদেশের ই-কমার্স ফ্যাশন বাজার সম্পর্কে আপনার গভীর জ্ঞান রয়েছে। প্রদত্ত পণ্যের (ছবি এবং/অথবা বিবরণ) উপর ভিত্তি করে, সম্পূর্ণ বাংলায় একটি বিস্তারিত ত্রি-স্তরীয় (3-stage) অ্যাড ফানেল পরিকল্পনা তৈরি করুন।

স্তরগুলো হলো: Awareness (TOFU), Consideration (MOFU), এবং Conversion (BOFU).

আপনার আউটপুটটি অবশ্যই একটি বৈধ JSON অ্যারে হতে হবে, যেখানে প্রতিটি স্তরের জন্য একটি করে অবজেক্ট থাকবে। প্রতিটি অবজেক্টে নিম্নলিখিত কী-গুলো থাকতে হবে:
{
  "stage_name": "স্তর ১: Awareness (সচেতনতা)",
  "objective": "এই ধাপের মূল উদ্দেশ্য কী, তা সংক্ষেপে লিখুন।",
  "target_audience": {
    "description": "এই স্তরে কাদের টার্গেট করা হবে তার একটি সাধারণ বর্ণনা।",
    "demographics": "টার্গেটেড এলাকা, বয়স এবং লিঙ্গ।",
    "interests": ["আগ্রহ ১", "আগ্রহ ২", "আগ্রহ ৩", "আগ্রহ ৪"]
  },
  "ad_format": "এই স্তরের জন্য সেরা অ্যাড ফরম্যাট (যেমন: ছোট ভিডিও রিল, ক্যারোসেল ইমেজ, সিঙ্গেল ইমেজ)।",
  "visual_concept": "বিজ্ঞাপনের জন্য ছবি বা ভিডিওর একটি সৃজনশীল ধারণা। দৃশ্য, রঙ, মডেলের ধরণ এবং সামগ্রিক ভাবমূর্তি বর্ণনা করুন।",
  "headline": "দর্শকদের মনোযোগ আকর্ষণ করার জন্য একটি শক্তিশালী বাংলা হেডলাইন।",
  "ad_copy": "একটি আকর্ষণীয় এবং তথ্যবহুল বাংলা অ্যাড কপি। এখানে পণ্যের সাথে সম্পর্কিত একটি গল্প বা সমস্যার কথা বলুন। **গুরুত্বপূর্ণ শব্দগুলো বোল্ড** করার জন্য মার্কডাউন ব্যবহার করুন এবং ইমোজি যোগ করুন।",
  "call_to_action": "এই স্তরের জন্য উপযুক্ত কল-টু-অ্যাকশন বাটন টেক্সট (যেমন: Learn More, Watch More)।",
  "content_details": {
      "visual_instructions": "এই স্তরের ভিডিও বা ছবির জন্য কী কী দেখাতে হবে তার একটি বিস্তারিত, ধাপে ধাপে নির্দেশনা দিন।",
      "script": "ভিডিওর জন্য একটি সংক্ষিপ্ত এবং আকর্ষণীয় বাংলা ভয়েসওভার স্ক্রিপ্ট দিন।"
    }
}

**ব্যবসার তথ্য (প্রয়োজনে ব্যবহারের জন্য):**
---
${businessInfo.trim() ? businessInfo : 'কোনো তথ্য দেওয়া হয়নি।'}
---

**পণ্যের বর্ণনা:** 
---
${productDesc}
---

JSON অ্যারে-এর বাইরে কোনো অতিরিক্ত লেখা, ব্যাখ্যা বা মার্কডাউন যোগ করবেন না।`;
    
    try {
      const text = await generateAdStrategy(prompt, files.length > 0 ? files[0] : undefined);
      const cleanedText = text.replace(/```json\n?|```/g, '').trim();
      const parsedJson = JSON.parse(cleanedText);
      setResult(parsedJson);
    } catch (err) {
      setError('অ্যাড ফানেল তৈরি করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAudio = async (stageIndex: number) => {
    if (!result) return;
    setGeneratingStates(prev => ({ ...prev, audio: { ...prev.audio, [stageIndex]: true } }));

    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }

    const scene = result[stageIndex];

    try {
        const base64Audio = await generateSpeech(scene.content_details.script, 'Kore');
        
        setResult(prev => {
            if (!prev) return null;
            const newResult = [...prev];
            newResult[stageIndex] = { ...newResult[stageIndex], generated_audio_b64: base64Audio };
            return newResult;
        });
        
        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
    } catch (err) {
        console.error(`Error generating audio for scene ${stageIndex}:`, err);
    } finally {
        setGeneratingStates(prev => ({ ...prev, audio: { ...prev.audio, [stageIndex]: false } }));
    }
  };

  const handleDownloadAudio = (stageIndex: number) => {
    if (!result || !result[stageIndex].generated_audio_b64) return;
    const base64Audio = result[stageIndex].generated_audio_b64!;
    const wavBlob = createWavBlob(base64Audio);
    const url = URL.createObjectURL(wavBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `stage-${stageIndex + 1}-audio.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  const stageColors = {
      border: ['border-blue-400', 'border-purple-400', 'border-green-400'],
      text: ['text-blue-400', 'text-purple-400', 'text-green-400'],
      bg: ['bg-blue-400/10', 'bg-purple-400/10', 'bg-green-400/10'],
  };

  return (
    <div>
        <ToolHeader
            icon={Filter}
            title="অ্যাড ফানেল জেনারেটর"
            description="পণ্যের জন্য ফেসবুক অ্যাড ফানেল তৈরি করুন।"
        />
        <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-6">
            <textarea
                rows={5}
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
            {error && <p className="text-red-400 text-center">{error}</p>}
            <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20">
                {isLoading ? "জেনারেট হচ্ছে..." : "অ্যাড ফানেল জেনারেট করুন"}
            </button>
        </div>
        
        <div className="mt-8">
            {isLoading && <Loader />}
            {result && (
            <div className="space-y-8">
                {result.map((stage, index) => (
                <div key={index} className={`bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden shadow-lg border-l-4 ${stageColors.border[index % 3]}`}>
                    <div className={`p-6 ${stageColors.bg[index % 3]}`}>
                        <h3 className={`text-2xl font-bold ${stageColors.text[index % 3]}`}>{stage.stage_name}</h3>
                        <div className="flex items-center gap-2 mt-2 text-gray-300">
                           <Goal size={18} className={stageColors.text[index % 3]}/>
                           <p><strong>লক্ষ্য:</strong> {stage.objective}</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* --- Targeting --- */}
                        <div>
                            <h4 className="flex items-center gap-2 font-semibold text-lg text-gray-200 mb-3"><Users size={20} className="text-indigo-400"/>টার্গেট অডিয়েন্স</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0d1117] p-4 rounded-lg border border-gray-700">
                                <p className="text-gray-300 md:col-span-2"><strong>বিবরণ:</strong> {stage.target_audience.description}</p>
                                <p className="text-gray-300"><strong>ডেমোগ্রাফিক:</strong> {stage.target_audience.demographics}</p>
                                <div>
                                    <strong className="text-gray-300">আগ্রহ:</strong>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {stage.target_audience.interests.map((interest, i) => (
                                            <span key={i} className="bg-gray-700 text-indigo-300 text-xs font-medium px-2.5 py-1 rounded-full">{interest}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- Ad Creative --- */}
                         <div>
                            <h4 className="flex items-center gap-2 font-semibold text-lg text-gray-200 mb-3"><Camera size={20} className="text-indigo-400"/>অ্যাড ক্রিয়েটিভ</h4>
                            <div className="bg-[#0d1117] p-4 rounded-lg border border-gray-700 space-y-3">
                                <p className="text-gray-300"><strong>অ্যাড ফরম্যাট:</strong> {stage.ad_format}</p>
                                <p className="text-gray-300"><strong>ভিজ্যুয়াল কনসেপ্ট:</strong> {stage.visual_concept}</p>
                            </div>
                        </div>

                         {/* --- Content Details --- */}
                        <div>
                            <h4 className="flex items-center gap-2 font-semibold text-lg text-gray-200 mb-3"><Wand2 size={20} className="text-indigo-400"/>কনটেন্ট বিস্তারিত</h4>
                            <div className="bg-[#0d1117] p-4 rounded-lg border border-gray-700 space-y-4">
                                <p className="text-gray-300"><strong>ভিজ্যুয়াল নির্দেশনা:</strong> {stage.content_details.visual_instructions}</p>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-semibold text-gray-300">ভিডিও স্ক্রিপ্ট:</p>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleCopy(stage.content_details.script, `script-${index}`)} className="p-2 bg-gray-600 hover:bg-gray-500 rounded-full transition-colors">
                                                {copiedField === `script-${index}` ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                            </button>
                                            {stage.generated_audio_b64 && (
                                                <button onClick={() => handleDownloadAudio(index)} className="p-2 bg-gray-600 hover:bg-gray-500 rounded-full transition-colors"><Download size={14}/></button>
                                            )}
                                            <button 
                                                onClick={() => handleGenerateAudio(index)}
                                                disabled={generatingStates.audio[index]}
                                                className="flex items-center gap-1.5 text-sm bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium py-1 px-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait"
                                            >
                                                {generatingStates.audio[index] ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <Volume2 size={14} />}
                                                <span>{stage.generated_audio_b64 ? "আবার শুনুন" : "অডিও জেনারেট করুন"}</span>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 italic bg-gray-900/50 p-3 rounded">"{stage.content_details.script}"</p>
                                </div>
                            </div>
                        </div>

                         {/* --- Ad Copy --- */}
                        <div>
                            <h4 className="flex items-center gap-2 font-semibold text-lg text-gray-200 mb-3"><FileText size={20} className="text-indigo-400"/>অ্যাড কপি</h4>
                             <div className="bg-[#0d1117] p-4 rounded-lg border border-gray-700 space-y-4">
                                <div>
                                    <div className="flex justify-between items-center">
                                      <p className="font-semibold text-gray-400">হেডলাইন:</p>
                                      <button onClick={() => handleCopy(stage.headline, `headline-${index}`)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                                        {copiedField === `headline-${index}` ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                        {copiedField === `headline-${index}` ? 'কপি হয়েছে' : 'কপি'}
                                      </button>
                                    </div>
                                    <p className="text-gray-200 text-lg mt-1">"{stage.headline}"</p>
                                </div>
                                <div className="border-t border-gray-700 my-2"></div>
                                <div>
                                    <div className="flex justify-between items-center">
                                      <p className="font-semibold text-gray-400">মূল লেখা:</p>
                                      <button onClick={() => handleCopy(stage.ad_copy, `adcopy-${index}`)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                                        {copiedField === `adcopy-${index}` ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                        {copiedField === `adcopy-${index}` ? 'কপি হয়েছে' : 'কপি'}
                                      </button>
                                    </div>
                                    <div className="text-gray-300 mt-1 prose prose-invert max-w-none prose-p:my-2">
                                        <MarkdownRenderer content={stage.ad_copy} />
                                    </div>
                                </div>
                                <div className="border-t border-gray-700 my-2"></div>
                                <div>
                                    <p className="font-semibold text-gray-400">কল-টু-অ্যাকশন:</p>
                                     <div className="mt-2 inline-block bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-md">
                                        {stage.call_to_action}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ))}
            </div>
            )}
            {!isLoading && !result && <div className="text-center text-gray-500 bg-[#161b22] border border-gray-800 p-10 rounded-xl">ফলাফল এখানে দেখানো হবে...</div>}
        </div>
    </div>
  );
}

export default AdFunnelGenerator;
