
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { FileWithPreview } from '../types';

interface ImageUploaderProps {
  files: FileWithPreview[];
  setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>;
  maxFiles?: number;
  label: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ files, setFiles, maxFiles = 1, label }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev.slice(0, maxFiles - newFiles.length), ...newFiles]);
  }, [setFiles, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles,
  });

  const removeFile = (fileToRemove: FileWithPreview, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(files.filter(file => file !== fileToRemove));
    URL.revokeObjectURL(fileToRemove.preview);
  };

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-300 ${
        isDragActive ? 'border-indigo-500 bg-gray-800' : 'border-gray-600 hover:border-indigo-500 hover:bg-gray-800/50'
      }`}
    >
      <input {...getInputProps()} />
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-gray-400">
          <UploadCloud className="w-12 h-12 mb-4" />
          <p className="font-semibold">{label}</p>
          <p className="text-sm">টেনে আনুন অথবা ক্লিক করে বেছে নিন</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {files.map(file => (
            <div key={file.name} className="relative group aspect-square">
              <img src={file.preview} alt={file.name} className="w-full h-full object-cover rounded-lg" />
              <button
                onClick={(e) => removeFile(file, e)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {files.length < maxFiles && (
            <div className="flex items-center justify-center aspect-square border-2 border-dashed border-gray-600 rounded-lg">
                <ImageIcon className="w-8 h-8 text-gray-500"/>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
