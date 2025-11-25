import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, Plus } from 'lucide-react';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  files: File[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, files }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file: File) => file.type === 'application/pdf');
      if (newFiles.length !== e.dataTransfer.files.length) {
        // You might want to show a toast or alert here, but for now we just filter
      }
      onFilesChange([...files, ...newFiles]);
    }
  }, [files, onFilesChange]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((file: File) => file.type === 'application/pdf');
      onFilesChange([...files, ...newFiles]);
    }
    // Reset input value to allow selecting the same file again if needed
    e.target.value = '';
  }, [files, onFilesChange]);

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="w-full p-3 bg-brand-50 border border-brand-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-2 bg-white rounded-md shadow-sm">
                  <FileText className="w-5 h-5 text-brand-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-brand-100 rounded-full transition-colors text-slate-500 hover:text-brand-700"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out text-center ${
          isDragging 
            ? 'border-brand-500 bg-brand-50' 
            : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div className={`p-3 rounded-full ${isDragging ? 'bg-brand-100' : 'bg-slate-100'}`}>
            {files.length > 0 ? (
              <Plus className={`w-6 h-6 ${isDragging ? 'text-brand-600' : 'text-slate-500'}`} />
            ) : (
              <Upload className={`w-6 h-6 ${isDragging ? 'text-brand-600' : 'text-slate-500'}`} />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">
              {files.length > 0 ? 'Add more PDFs' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-slate-500">
              PDF files only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};