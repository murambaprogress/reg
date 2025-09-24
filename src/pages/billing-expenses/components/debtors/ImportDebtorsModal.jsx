import React, { useState } from 'react';
import { importDebtorsExcel } from '../../../../api/billing';
import Icon from '../../../../components/AppIcon';

const ImportDebtorsModal = ({ isOpen, onClose, onSuccess, onError }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
    } else {
      onError({ message: 'Please select a valid Excel or CSV file (.xlsx, .xls, or .csv)' });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      onError({ message: 'Please select a file to upload' });
      return;
    }

    setUploading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await importDebtorsExcel(formData);
      setImportResult(result);
      onSuccess(result);
      setFile(null);
      // Do not close modal immediately; show summary/errors
    } catch (error) {
      let details = error.response?.data;
      setImportResult(details ? details : { error: error.message || 'Failed to import debtors' });
      onError({ message: details?.error || error.message || 'Failed to import debtors' });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create proper debtor template content
    const headers = 'Customer Name,Customer Phone,Total Outstanding\n';
    const rows = [
      'John Doe,+263772123456,1500.00',
      'Jane Smith,+263773654321,2500.00',
      'Bob Johnson,+263774987654,1000.00'
    ].join('\n');
    
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'debtors_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">Import Debtors from Excel/CSV</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <Icon name="X" size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Import result summary and errors */}
          {importResult && (
            <div className="mb-4">
              {importResult.message && (
                <div className="text-green-700 bg-green-50 border border-green-200 rounded p-2 mb-2">
                  {importResult.message}
                  {typeof importResult.success_count === 'number' && (
                    <span className="block text-sm mt-1">Imported: {importResult.success_count}, Errors: {importResult.error_count || 0}</span>
                  )}
                </div>
              )}
              {importResult.error && (
                <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2 mb-2">
                  <strong>Error:</strong> {importResult.error}
                  {importResult.details && (
                    <div className="text-xs mt-1">{importResult.details}</div>
                  )}
                </div>
              )}
              {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto text-xs bg-gray-50 border border-gray-200 rounded p-2">
                  <strong>Row Errors:</strong>
                  <ul className="list-disc ml-4">
                    {importResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel (.xlsx, .xls) or CSV (.csv) file containing debtor information. The file should have columns for Customer Name, Customer Phone, and Total Outstanding.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="text-blue-600 hover:text-blue-800 text-sm underline mb-4 flex items-center"
            >
              <Icon name="Download" size={16} className="mr-1" />
              Download Template
            </button>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center">
                <Icon name="FileSpreadsheet" size={24} className="text-green-500 mr-2" />
                <span className="text-sm text-gray-700">{file.name}</span>
                <button
                  onClick={() => setFile(null)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>
            ) : (
              <div>
                <Icon name="Upload" size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop your Excel or CSV file here, or
                </p>
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-800 underline">
                    browse to select
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              disabled={uploading}
            >
              Close
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {uploading ? (
                <>
                  <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Icon name="Upload" size={16} className="mr-2" />
                  Import Debtors
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportDebtorsModal;
