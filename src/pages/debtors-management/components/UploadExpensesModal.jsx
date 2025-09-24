import React, { useState } from 'react';
import { FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Modal, Alert, Button } from '@/components/ui';
import FileUpload from '@/components/ui/FileUpload';
import * as XLSX from 'xlsx';

const UploadExpensesModal = ({
  isOpen,
  onClose,
  onUpload,
  loading,
  error
}) => {
  const [uploadError, setUploadError] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [validating, setValidating] = useState(false);

  const handleFileSelect = async (file) => {
    try {
      setUploadError(null);
      setParsedData(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

          // Find all detail and amount columns
          const headers = data[0] || [];
          let expenses = [];
          let currentDate = null;
          
          // Process each row
          for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            // Check for date in first column
            if (row[0]) {
              // Try to parse the date from Excel
              try {
                // Convert Excel date number to JS date if needed
                currentDate = typeof row[0] === 'number' 
                  ? new Date(Math.round((row[0] - 25569) * 86400 * 1000))
                  : new Date(row[0]);
                
                if (isNaN(currentDate.getTime())) {
                  throw new Error('Invalid date');
                }
              } catch (e) {
                setUploadError(`Invalid date format in row ${i + 1}`);
                return;
              }
            }

            // Process the left side columns (0-2)
            if (row[1] && row[2]) { // If there's a detail and amount on the left
              const amount = parseFloat(String(row[2]).replace('$', '').replace(',', ''));
              if (isNaN(amount)) {
                setUploadError(`Invalid amount format in row ${i + 1}`);
                return;
              }
              
              expenses.push({
                date: currentDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
                details: String(row[1]).trim(),
                amount: amount
              });
            }

            // Process the right side columns (3-5)
            if (row[3] && row[4]) { // If there's a detail and amount on the right
              expenses.push({
                date: currentDate,
                details: String(row[3]),
                amount: parseFloat(String(row[4]).replace('$', '').replace(',', '')) || 0
              });
            }
          }

          // Validate expenses
          expenses = expenses.filter(record => {
            return record.details && 
                   !isNaN(record.amount) && 
                   record.details.toLowerCase() !== 'balance c/d' &&
                   record.details.toLowerCase() !== 'balance b/d';
          });

          setParsedData(expenses);
        } catch (error) {
          setUploadError(error.message || 'Failed to parse file');
        }
      };

      reader.onerror = () => {
        setUploadError('Failed to read file');
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      setUploadError(error.message || 'Failed to process file');
    }
  };

  const handleDownloadTemplate = () => {
    // Create template headers
    const template = [
      ['Date', 'Details', '$', '', 'Details', '$'],
      ['22/8/2023', 'Engine Oil', '100.00', '', 'View Mirror', '30.00'],
      ['', 'Oil Filter', '40.00', '', 'ATF Tank', '30.00'],
      ['', 'Air Filter', '20.00', '', 'Black window glass', '40.00'],
      ['', 'Part Payment', '-100.00', '', 'Black window weather strip', '20.00'],
      ['', 'Balance c/d', '60.00', '', 'Half moon rubber', '20.00'],
      ['', '', '', '', 'Balance b/d', '40.00']
    ];

    // Create worksheet with specific column widths
    const ws = XLSX.utils.aoa_to_sheet(template);
    
    // Set column widths
    ws['!cols'] = [
      { width: 12 }, // Date
      { width: 25 }, // Details (left)
      { width: 10 }, // Amount (left)
      { width: 5 },  // Spacer
      { width: 25 }, // Details (right)
      { width: 10 }  // Amount (right)
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ExpensesTemplate');
    XLSX.writeFile(wb, 'expenses_import_template.xlsx');
  };

  const handleSubmit = () => {
    if (!parsedData) return;
    onUpload(parsedData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Expenses"
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Import Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Download and fill the Excel template</li>
            <li>• Enter the date in the first column (DD/MM/YYYY)</li>
            <li>• Fill in details and amounts in their respective columns</li>
            <li>• Use negative amounts for payments (e.g., -100.00)</li>
            <li>• Balance b/d and c/d will be calculated automatically</li>
          </ul>
        </div>

        {/* Template Download Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Download Template
        </Button>

        {/* File Upload */}
        <FileUpload
          accept=".xlsx,.xls,.csv"
          maxSize={5 * 1024 * 1024} // 5MB
          onFilesSelected={handleFileSelect}
          label="Upload Expenses File"
          hint="Supports .xlsx, .xls and .csv files up to 5MB"
          disabled={loading}
        />

        {/* Status and Error Display */}
        {validating && (
          <Alert variant="info" className="mt-4">
            <span>Validating file contents...</span>
          </Alert>
        )}
        {(error || uploadError) && (
          <Alert variant="error" className="mt-4">
            <AlertCircle className="w-4 h-4" />
            <span>{error || uploadError}</span>
          </Alert>
        )}
        {!error && !uploadError && parsedData && (
          <Alert variant="success" className="mt-4">
            <span>File validated successfully! {parsedData.length} records found.</span>
          </Alert>
        )}

        {/* Preview and Submit */}
        {parsedData && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Preview ({parsedData.length} records)</h4>
            <div className="max-h-40 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Details</th>
                    <th className="p-2 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsedData.map((row, index) => (
                    <tr key={index}>
                      <td className="p-2">{row.date}</td>
                      <td className="p-2">{row.details}</td>
                      <td className="p-2">${row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!parsedData || loading}
            loading={loading}
          >
            {loading ? 'Importing...' : 'Import Records'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UploadExpensesModal;