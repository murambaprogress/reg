import React from 'react';
import { FileSpreadsheet, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui';

export const ImportSection = ({ onDownloadTemplate, onImportClick }) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex-shrink-0">
        <Upload className="w-8 h-8 text-blue-500" />
      </div>
      
      <div className="flex-grow">
        <h3 className="text-sm font-medium text-blue-800">Import Debtors from Excel</h3>
        <p className="text-xs text-blue-600 mt-1">
          Download the template, fill it with your data, and upload it back
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={onDownloadTemplate}
          className="bg-white hover:bg-gray-50"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Get Template
        </Button>
        <Button
          variant="primary"
          onClick={onImportClick}
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Excel
        </Button>
      </div>
    </div>
  );
};

export default ImportSection;