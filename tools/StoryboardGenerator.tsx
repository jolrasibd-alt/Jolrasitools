
import React, { useState, useRef } from 'react';
import { Clapperboard, Wand2, Image as ImageIcon, Volume2, Copy, Check, Download } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import Loader from '../components/Loader';
import { generateAdStrategy, generateImageFromText, generateSpeech } from '../services/geminiService';
import { useSettings } from '../context/SettingsContext';
import ImageUploader from '../components/ImageUploader';
import { FileWithPreview } from '../types';

// Interfaces
interface StoryboardScene {
  scene: number;
  story_part: string;
  video_prompt: string;
  generated_image?: string;
  generated_audio_b64?: string;
}

// Audio helper functions (from guidelines)
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
  const frameCount = dataInt16.length / 1; // numChannels = 1
  const buffer = ctx.createBuffer(1, frameCount, 24000); // sampleRate = 24000

  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}


const StoryboardGenerator: React.FC = () => {
  // Input State
  const [imageFile, setImageFile] = useState<FileWithPreview[]>([]);
  const [productDetails, setProductDetails] = useState('');
  
  // Output State
  const [storyboard, setStoryboard] = useState<StoryboardScene[] | null>(null);
  const [narrationVoice, setNarrationVoice] = useState<'Female' | 'Male'>('Female');
  
  // Control State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatingStates, setGeneratingStates] = useState<{ image: { [key: number]: boolean }, audio: { [key: number]: boolean } }>({ image: {}, audio: {} });
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const { settings } = useSettings();
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleGenerateStoryboard = async () => {
    if (imageFile.length === 0 || !productDetails.trim()) {
      setError('অনুগ্রহ করে পণ্যের ছবি এবং বিবরণ উভয়ই দিন।');
      return;
    }
    setError('');
    setIsLoading(true);
    setStoryboard(null);

    const prompt = `You are a world-class creative director for a top marketing agency, specializing in viral Facebook video ads for the Bangladeshi e-commerce market. Your task is to create a compelling 3-scene storyboard based on the provided product image and details.

Follow this structure strictly: Problem -> Solution -> Call to Action.

For each scene, provide:
1.  **story_part**: An engaging narration script in Bengali for a voiceover, suitable for a 7-second video clip when spoken at a natural pace.
2.  **video_prompt**: A detailed, descriptive prompt in English for an AI image/video generator. This prompt should describe the scene, camera angles (e.g., close-up, handheld shot), lighting, mood, and actions vividly.

The final output MUST be a single, valid JSON array containing exactly 3 objects. Each object must have the keys "scene", "story_part", and "video_prompt". Do not include any text, markdown, or explanations outside of the JSON array.

Product Details: ${productDetails}`;

    try {
      const result = await generateAdStrategy(prompt, imageFile[0]);
      const cleanedJson = result.replace(/```json\n?|```/g, '').trim();
      const parsedStoryboard = JSON.parse(cleanedJson);
      if (Array.isArray(parsedStoryboard) && parsedStoryboard.length > 0) {
        setStoryboard(parsedStoryboard);
      } else {
        throw new Error("Invalid storyboard format received.");
      }
    } catch (err) {
      setError('স্টোরিবোর্ড তৈরি করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateImage = async (sceneIndex: number) => {
    if (!storyboard) return;
    setGeneratingStates(prev => ({ ...prev, image: { ...prev.image, [sceneIndex]: true } }));

    const scene = storyboard[sceneIndex];
    const prompt = `${scene.video_prompt}, photorealistic, high-end product photography, cinematic lighting`;
    
    try {
        const imageUrl = await generateImageFromText(prompt, '9:16');
        setStoryboard(prev => {
            if (!prev) return null;
            const newStoryboard = [...prev];
            newStoryboard[sceneIndex] = { ...newStoryboard[sceneIndex], generated_image: imageUrl };
            return newStoryboard;
        });
    } catch (err) {
        console.error(`Error generating image for scene ${sceneIndex}:`, err);
    } finally {
        setGeneratingStates(prev => ({ ...prev, image: { ...prev.image, [sceneIndex]: false } }));
    }
  };

  const handleGenerateAudio = async (sceneIndex: number) => {
    if (!storyboard) return;
    setGeneratingStates(prev => ({ ...prev, audio: { ...prev.audio, [sceneIndex]: true } }));

    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }

    const scene = storyboard[sceneIndex];
    const voice = narrationVoice === 'Female' ? 'Kore' : 'Puck';

    try {
        const base64Audio = await generateSpeech(scene.story_part, voice);
        
        setStoryboard(prev => {
            if (!prev) return null;
            const newStoryboard = [...prev];
            newStoryboard[sceneIndex] = { ...newStoryboard[sceneIndex], generated_audio_b64: base64Audio };
            return newStoryboard;
        });
        
        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
    } catch (err) {
        console.error(`Error generating audio for scene ${sceneIndex}:`, err);
    } finally {
        setGeneratingStates(prev => ({ ...prev, audio: { ...prev.audio, [sceneIndex]: false } }));
    }
  };

  const handleCopy = (text: string, type: string, sceneIndex: number) => {
    navigator.clipboard.writeText(text);
    const key = `${type}-${sceneIndex}`;
    setCopiedStates({ [key]: true });
    setTimeout(() => setCopiedStates(prev => ({...prev, [key]: false })), 2000);
  };

  const handleDownloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

    // RIFF chunk
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    // fmt sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // byteRate
    view.setUint16(32, numChannels * (bitsPerSample / 8), true); // blockAlign
    view.setUint16(34, bitsPerSample, true);
    // data sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Write PCM data
    for (let i = 0; i < dataLength; i++) {
      view.setUint8(44 + i, pcmData[i]);
    }

    return new Blob([view], { type: 'audio/wav' });
  };

  const handleDownloadAudio = (sceneIndex: number) => {
    if (!storyboard || !storyboard[sceneIndex].generated_audio_b64) return;
    
    const base64Audio = storyboard[sceneIndex].generated_audio_b64!;
    const wavBlob = createWavBlob(base64Audio);
    const url = URL.createObjectURL(wavBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `scene-${sceneIndex + 1}-audio.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <div>
      <ToolHeader
        icon={Clapperboard}
        title="AI Storyboard Generator"
        description="Turn your product into a compelling visual story."
      />

      <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-medium text-gray-300 mb-2">১. পণ্যের ছবি আপলোড করুন</label>
            <ImageUploader files={imageFile} setFiles={setImageFile} maxFiles={1} label="Drop your product image here, or browse" />
          </div>
          <div>
            <label htmlFor="productDetails" className="block text-lg font-medium text-gray-300 mb-2">২. পণ্যের বিবরণ দিন</label>
            <textarea
              id="productDetails"
              rows={3}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="e.g., '100% Cotton, Blue, keeps you cool all day'"
              value={productDetails}
              onChange={(e) => setProductDetails(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="text-red-400 mt-2 text-center">{error}</p>}
        <button
          onClick={handleGenerateStoryboard}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20"
        >
          {isLoading ? 'জেনারেট হচ্ছে...' : <><Wand2 size={18} /> Generate Facebook Ad Storyboard</>}
        </button>
      </div>

      {isLoading && <div className="mt-8"><Loader message="আপনার স্টোরিবোর্ড তৈরি করা হচ্ছে..." /></div>}

      {storyboard && (
        <div className="mt-8 bg-[#161b22] border border-gray-800 p-6 rounded-xl animate-fade-in">
          <div className="flex items-center justify-center gap-6 mb-6">
            <span className="text-lg font-medium text-gray-300">Narration Voice:</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="voice" value="Female" checked={narrationVoice === 'Female'} onChange={() => setNarrationVoice('Female')} className="appearance-none w-4 h-4 bg-[#0d1117] border-2 border-gray-500 rounded-full checked:bg-indigo-500 checked:border-indigo-500 transition duration-200" />
                <span>Female</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="voice" value="Male" checked={narrationVoice === 'Male'} onChange={() => setNarrationVoice('Male')} className="appearance-none w-4 h-4 bg-[#0d1117] border-2 border-gray-500 rounded-full checked:bg-indigo-500 checked:border-indigo-500 transition duration-200" />
                <span>Male</span>
              </label>
            </div>
          </div>

          <div className="space-y-8">
            {storyboard.map((scene, index) => (
              <div key={index} className="border-b border-gray-800 pb-8 last:border-b-0 last:pb-0">
                <h3 className="text-xl font-bold text-indigo-400 mb-4">Scene {index + 1}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  {/* Left: Image Generation */}
                   <div className="relative flex flex-col items-center justify-center bg-[#0d1117] border border-gray-700 rounded-lg p-2 aspect-[9/16] w-full max-w-xs mx-auto group">
                    {generatingStates.image[index] ? <Loader message="ছবি তৈরি হচ্ছে..." /> :
                     scene.generated_image ? (
                        <>
                            <img src={scene.generated_image} alt={`Scene ${index + 1}`} className="w-full h-full object-contain rounded-md" />
                             <button 
                                onClick={() => handleDownloadImage(scene.generated_image!, `scene-${index + 1}.png`)}
                                className="absolute bottom-2 right-2 flex items-center gap-1.5 text-xs bg-black/60 hover:bg-black/80 text-white font-medium py-1.5 px-3 rounded-full transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
                            >
                                <Download size={14} />
                                <span>Download</span>
                            </button>
                        </>
                     ) :
                     <div className="text-center text-gray-500">
                        <ImageIcon size={48} className="mx-auto mb-2" />
                        <button onClick={() => handleGenerateImage(index)} className="mt-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">Generate Image</button>
                     </div>
                    }
                  </div>
                  {/* Right: Story Details */}
                  <div className="space-y-4">
                    <div className="bg-[#0d1117] border border-gray-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-200">Story Part</h4>
                        <div className="flex items-center gap-2">
                            {scene.generated_audio_b64 && (
                                <button
                                    onClick={() => handleDownloadAudio(index)}
                                    className="flex items-center gap-1.5 text-sm bg-gray-600/50 hover:bg-gray-600/80 text-white font-medium p-2 rounded-full transition-colors"
                                    aria-label="Download Audio"
                                >
                                    <Download size={14} />
                                </button>
                            )}
                            <button onClick={() => handleCopy(scene.story_part, 'story', index)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors p-2 rounded-full bg-gray-600/50 hover:bg-gray-600/80">
                                {copiedStates[`story-${index}`] ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                            <button 
                              onClick={() => handleGenerateAudio(index)}
                              disabled={generatingStates.audio[index]}
                              className="flex items-center gap-1.5 text-sm bg-indigo-600/50 hover:bg-indigo-600/80 text-white font-medium py-1 px-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait"
                            >
                                {generatingStates.audio[index] ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <Volume2 size={14} />}
                                <span>{scene.generated_audio_b64 ? "Play Again" : "Generate Audio"}</span>
                            </button>
                        </div>
                      </div>
                      <p className="text-gray-300">{scene.story_part}</p>
                    </div>
                    <div className="bg-[#0d1117] border border-gray-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-200">Video Prompt</h4>
                        <button onClick={() => handleCopy(scene.video_prompt, 'prompt', index)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                            {copiedStates[`prompt-${index}`] ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                            <span>{copiedStates[`prompt-${index}`] ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-gray-400 text-sm font-mono bg-gray-900 p-2 rounded">{scene.video_prompt}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryboardGenerator;
