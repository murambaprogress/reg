import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Modal, Alert, Button } from '../../../components/ui';
import FileUpload from '../../../components/ui/FileUpload';
import { importDebtors, downloadDebtorTemplate } from '../../../api/billing';

export const ImportDebtorsModal = ({
  isOpen,
  onClose,
  onDownloadTemplate,
  onSuccess,
}) => {
  const [importError, setImportError] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const importMutation = useMutation({
    mutationFn: (formData) => {
      console.log('Starting mutation with formData');
      return importDebtors(formData);
    },
    onSuccess: (data) => {
      console.log('Import mutation success:', data);
      console.log('Full response data:', JSON.stringify(data, null, 2));
      setImportResult(data);
      
      // Treat any response with imported_count or success_count as success
      const imported = data.imported_count || data.success_count || data.count || 0;
      console.log('Imported count:', imported, 'Error count:', data.error_count);
      
      // Consider it successful if we have imports and no errors, OR if we have a success message
      const isSuccessful = (imported > 0 && (!data.error_count || data.error_count === 0)) || 
                          (data.message && data.message.includes('completed') && data.success_count > 0);
      
      console.log('Import considered successful:', isSuccessful);
      console.log('About to call onSuccess callback with data:', data);
      
      if (isSuccessful) {
        console.log('Calling parent onSuccess callback...');
        onSuccess(data); // Call immediately to refresh debtors list
        
        setTimeout(() => {
          console.log('Closing modal after timeout...');
          onClose();
        }, 1500);
      } else {
        console.log('Import not considered successful, not calling onSuccess callback');
      }
    },
    onError: (error) => {
      console.error('Import mutation error:', error);
      const errorMessage = error.response?.data?.detail
        || error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'Failed to import debtors';
      setImportError(errorMessage);
    }
  });

  const handleFileUpload = async (file) => {
    try {
      if (!file) {
        console.error('No file provided to handleFileUpload');
        setImportError('Please select a file');
        return;
      }

      console.log('Handling file upload:', file.name, 'Type:', file.type);
      setImportError(null);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', file);
      console.log('FormData created with file:', file.name);
      
      // Log FormData contents
      for (let [key, value] of formData.entries()) {
        console.log('FormData entry:', key, value);
      }

      importMutation.mutate(formData);
    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      setImportError(error.message || 'Error uploading file');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Debtors"
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Import Instructions</h3>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• Download and fill the CSV template</li>
            <li>• Required fields: Customer Name, Amount, Due Date, Description</li>
            <li>• Save the file as CSV format</li>
            <li>• Upload the completed file here</li>
          </ul>
        </div>

        {/* Template Download Button */}
        <Button
          variant="outline"
          onClick={onDownloadTemplate}
          className="w-full flex items-center gap-2 justify-center"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Download Template CSV
        </Button>

        {/* File Upload */}
        <FileUpload
          accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          maxSize={10 * 1024 * 1024} // 10MB
          onFilesSelected={handleFileUpload}
          onError={setImportError}
          label="Upload CSV or Excel File"
          hint="Upload your file (max 10MB)"
          disabled={importMutation.isLoading}
          showSelectedFiles={true}
        />

        {/* Loading State */}
        {importMutation.isLoading && (
          <div className="text-center text-sm text-gray-500">
            Importing debtors, please wait...
          </div>
        )}

        {/* Error Display */}
        {importError && (
          <Alert variant="error" className="mt-4">
            <AlertCircle className="w-4 h-4 mr-2" />
            {importError}
          </Alert>
        )}

        {/* Success/Results Display */}
        {importResult && (
          <div className="mt-4 space-y-3">
            <Alert 
              variant={importResult.error_count > 0 ? "warning" : "success"}
            >
              Successfully imported {importResult.success_count || importResult.count} debtors
              {importResult.error_count > 0 && ` with ${importResult.error_count} errors`}
            </Alert>

            {/* Import Details */}
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h4 className="font-medium text-gray-800 mb-2">Import Summary</h4>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-600">Total Processed</dt>
                  <dd className="font-medium text-gray-900">{importResult.total || importResult.count || 0}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Successfully Imported</dt>
                  <dd className="font-medium text-green-600">{importResult.success_count || importResult.count || 0}</dd>
                </div>
                {importResult.error_count > 0 && (
                  <div className="col-span-2">
                    <dt className="text-gray-600">Errors</dt>
                    <dd className="font-medium text-red-600">{importResult.error_count}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Display Errors if any */}
            {importResult.error_count > 0 && importResult.errors?.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto">
                <h4 className="font-medium text-red-800 mb-1">Import Errors:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
