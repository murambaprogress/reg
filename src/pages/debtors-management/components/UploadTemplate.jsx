import React from 'react';
import { Upload } from 'lucide-react';

const UploadTemplate = () => (
  <div className="flex flex-col items-center justify-center text-blue-500">
    <Upload className="w-12 h-12 mb-2" />
    <p className="text-sm font-medium">Click here to upload your Excel file</p>
    <p className="text-xs text-blue-400">Supports .xlsx and .xls files</p>
  </div>
);

export default UploadTemplate;