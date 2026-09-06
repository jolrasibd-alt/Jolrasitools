
import React, { useState, useRef, useEffect } from 'react';
import Loader from '../components/Loader';
import { removeWatermark } from '../services/geminiService';
import { Download } from 'lucide-react';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const WatermarkRemover: React.FC = () => {
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [displayImageUrl, setDisplayImageUrl] = useState<string | null>(null);
  const [selections, setSelections] = useState<Rect[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResult, setIsResult] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas and draw the image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (displayImageUrl) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    } else {
        // Placeholder text if no image
        ctx.fillStyle = '#4a5568'; // gray-600
        ctx.font = '16px "Noto Sans Bengali", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('আপনার ছবি এখানে আপলোড করুন...', canvas.width / 2, canvas.height / 2);
    }
    
    // Draw committed selections
    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    selections.forEach(rect => {
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    });

    // Draw current drawing rectangle
    if (isDrawing && currentRect) {
        ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
        ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
    }
  };
  
  useEffect(() => {
    draw();
  }, [displayImageUrl, selections, currentRect, isDrawing]);


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOriginalImageFile(file);
      setSelections([]);
      setError('');
      setIsResult(false);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        imageRef.current.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            const aspectRatio = imageRef.current.width / imageRef.current.height;
            const container = canvas.parentElement;
            if (container) {
                const maxWidth = container.clientWidth;
                const maxHeight = 500; // Max height constraint
                let newWidth = maxWidth;
                let newHeight = newWidth / aspectRatio;
                if (newHeight > maxHeight) {
                    newHeight = maxHeight;
                    newWidth = newHeight * aspectRatio;
                }
                canvas.width = newWidth;
                canvas.height = newHeight;
            }
          }
          setDisplayImageUrl(url); // Trigger redraw
        };
        imageRef.current.src = url;
      };
      reader.readAsDataURL(file);
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!originalImageFile || isResult) return;
    setIsDrawing(true);
    setStartPoint(getCanvasCoordinates(e));
    setCurrentRect(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    const endPoint = getCanvasCoordinates(e);
    const x = Math.min(startPoint.x, endPoint.x);
    const y = Math.min(startPoint.y, endPoint.y);
    const width = Math.abs(startPoint.x - endPoint.x);
    const height = Math.abs(startPoint.y - endPoint.y);
    setCurrentRect({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentRect && currentRect.width > 0 && currentRect.height > 0) {
      setSelections(prev => [...prev, currentRect]);
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  };

  const handleUndo = () => setSelections(prev => prev.slice(0, -1));
  const handleClear = () => setSelections([]);

  const handleRemoveWatermark = async () => {
    if (!originalImageFile) {
        setError("অনুগ্রহ করে প্রথমে একটি ছবি আপলোড করুন।");
        return;
    }
    if (selections.length === 0) {
        setError("অনুগ্রহ করে ওয়াটারমার্কের অংশটি সিলেক্ট করুন।");
        return;
    }
    setError('');
    setIsLoading(true);

    try {
        // Create mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = imageRef.current.naturalWidth;
        maskCanvas.height = imageRef.current.naturalHeight;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) throw new Error("Could not create mask context");
        
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        maskCtx.fillStyle = 'white';
        const scaleX = maskCanvas.width / canvasRef.current!.width;
        const scaleY = maskCanvas.height / canvasRef.current!.height;
        selections.forEach(rect => {
            maskCtx.fillRect(rect.x * scaleX, rect.y * scaleY, rect.width * scaleX, rect.height * scaleY);
        });

        const maskBlob = await new Promise<Blob | null>(resolve => maskCanvas.toBlob(resolve, 'image/png'));
        if (!maskBlob) throw new Error("Failed to create mask blob.");
        const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });

        const resultUrl = await removeWatermark(originalImageFile, maskFile);
        
        imageRef.current.src = resultUrl; // Update image ref
        setDisplayImageUrl(resultUrl); // Update display
        setSelections([]); // Clear selections after successful removal
        setIsResult(true);
        
    } catch (err) {
        setError('ওয়াটারমার্ক সরাতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (displayImageUrl && isResult) {
      const link = document.createElement('a');
      link.href = displayImageUrl;
      link.download = `watermark-removed.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-5xl font-bold text-cyan-400">
        Watermark Remover
      </h1>
      <p className="text-lg text-gray-400 mt-2 mb-6">
        ছবি থেকে যেকোনো ওয়াটারমার্ক মুছে ফেলুন সহজেই।
      </p>
      
      <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl space-y-4">
        <div className="flex justify-center">
             <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors"
             >
                Upload Image
             </button>
             <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        </div>

        <div className="w-full min-h-[400px] h-[500px] bg-[#0d1117] border border-gray-700 rounded-lg flex items-center justify-center p-2 relative">
            <canvas
              ref={canvasRef}
              className={`${isResult ? 'cursor-default' : 'cursor-crosshair'} ${isLoading ? 'opacity-50' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp} // Stop drawing if mouse leaves canvas
            />
            {isLoading && <div className="absolute inset-0 flex items-center justify-center"><Loader message="ওয়াটারমার্ক সরানো হচ্ছে..." /></div>}
        </div>
        
        {error && <p className="text-red-400 text-center">{error}</p>}
        
        <div className="flex flex-wrap justify-center gap-4">
            <button
                onClick={handleUndo}
                disabled={selections.length === 0 || isLoading || isResult}
                className="bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Undo Selection
            </button>
            <button
                onClick={handleClear}
                disabled={selections.length === 0 || isLoading || isResult}
                className="bg-red-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Clear All Selections
            </button>
            <button
                onClick={handleRemoveWatermark}
                disabled={isLoading || selections.length === 0 || isResult}
                className="bg-cyan-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Remove Watermark
            </button>
             {isResult && (
                <button
                    onClick={handleDownload}
                    className="bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <Download size={16} /> Download Image
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default WatermarkRemover;
