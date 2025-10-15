import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { FileSpreadsheet, Plus, Search } from 'lucide-react';
import { fetchDebtors, importDebtors, downloadDebtorTemplate } from '../../api/billing';
import { Card, DataGrid, Button, TextInput, Select } from '../../components/ui';
import { DebtorForm } from './components/DebtorForm';
import { DebtorPaymentDialog } from './components/DebtorPaymentDialog';
import { ImportDebtorsModal } from './components/ImportDebtorsModal';
import { formatCurrency } from '../../utils/formatters';

function DebtorsManagementPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [importError, setImportError] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [lastUploadStatus, setLastUploadStatus] = useState(null);

  const { 
    data: debtors = [], 
    isLoading,
    refetch: refetchDebtors
  } = useQuery({
    queryKey: ['debtors', searchTerm, selectedStatus],
    queryFn: () => fetchDebtors({ 
      customer_name: searchTerm, 
      status: selectedStatus 
    }),
    enabled: true
  });

  const importMutation = useMutation({
    mutationFn: importDebtors,
    onSuccess: async (data) => {
      setShowUploadModal(false);
      setImportError(null);
      // Invalidate and refetch in sequence
      await queryClient.invalidateQueries({ queryKey: ['debtors'] });
      await refetchDebtors();
      setLastUploadStatus({
        type: 'success',
        message: `Successfully imported ${data.count || data.success_count} debtors`
      });
    },
    onError: (error) => {
      setImportError(error.response?.data?.error || 'Failed to import debtors');
      setLastUploadStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to import debtors'
      });
    }
  });

  const handleDownloadTemplate = async () => {
    try {
      await downloadDebtorTemplate();
    } catch (error) {
      console.error('Error downloading template:', error);
      setLastUploadStatus({
        type: 'error',
        message: 'Failed to download template'
      });
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setImportError('Please upload a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    importMutation.mutate(formData);
  };

  const columns = [
    { field: 'customer_name', header: 'Customer', sortable: true },
    { 
      field: 'total_outstanding', 
      header: 'Outstanding', 
      sortable: true,
      render: (row) => formatCurrency(row.total_outstanding)
    },
    {
      field: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => {
        const statusClasses = {
          paid: 'bg-green-100 text-green-800',
          overdue: 'bg-red-100 text-red-800',
          default: 'bg-yellow-100 text-yellow-800'
        };
        const className = statusClasses[row.status] || statusClasses.default;
        return (
          <span className={`px-2 py-1 rounded text-sm ${className}`}>
            {row.status}
          </span>
        );
      }
    },
    { field: 'days_overdue', header: 'Days Overdue', sortable: true },
    {
      field: 'actions',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedDebtor(row);
            setShowPaymentDialog(true);
          }}
        >
          Record Payment
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Debtors Management</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="border-gray-300"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          <Button 
            variant="primary"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Debtor
          </Button>
        </div>
      </div>

      {/* Data Grid */}
      <Card className="p-4">
        <div className="flex gap-4 mb-4">
          <TextInput
            icon={<Search className="w-4 h-4" />}
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-48"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="payment_plan">Payment Plan</option>
          </Select>
        </div>
        <DataGrid
          data={debtors}
          columns={columns}
          loading={isLoading}
        />
      </Card>

      {/* Modals */}
      {showAddForm && (
        <DebtorForm
          onSubmit={async (data) => {
            try {
              await importDebtors(data);
              queryClient.invalidateQueries('debtors');
              setShowAddForm(false);
            } catch (error) {
              console.error('Error adding debtor:', error);
            }
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {lastUploadStatus && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
          lastUploadStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {lastUploadStatus.message}
        </div>
      )}

      <ImportDebtorsModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setImportError(null);
        }}
        onDownloadTemplate={handleDownloadTemplate}
        onSuccess={async (result) => {
          console.log('DebtorsManagementPage onSuccess called with:', result);
          
          try {
            // Force a complete refresh of the debtors data using multiple approaches
            await queryClient.invalidateQueries({ queryKey: ['debtors'] });
            await queryClient.refetchQueries({ queryKey: ['debtors'] });
            
            // Add a small delay and do another refetch for extra reliability
            setTimeout(async () => {
              console.log('Performing additional refetch for reliability');
              await refetchDebtors();
            }, 500);
            
            console.log('Data refresh completed');
            
            // Calculate the success count from any available property
            const successCount = result.count || result.success_count || 
                              result.imported_count || result.transactions_processed || 0;
            
            setLastUploadStatus({
              type: 'success',
              message: `Successfully imported ${successCount} debtors`
            });
            
            // Keep the status visible for 5 seconds
            setTimeout(() => {
              setLastUploadStatus(null);
            }, 5000);
          } catch (error) {
            console.error('Error refreshing data after import:', error);
            // Still show success message even if refresh failed
            setLastUploadStatus({
              type: 'success',
              message: 'Import successful. Please refresh page to see updates.'
            });
          }
        }}
      />

      {selectedDebtor && (
        <DebtorPaymentDialog
          isOpen={showPaymentDialog}
          onClose={() => {
            setShowPaymentDialog(false);
            setSelectedDebtor(null);
          }}
          debtor={selectedDebtor}
          onPaymentRecorded={() => {
            queryClient.invalidateQueries('debtors');
            setShowPaymentDialog(false);
            setSelectedDebtor(null);
          }}
        />
      )}
    </div>
  );
}

export default DebtorsManagementPage;
