import React from 'react';

const TestModal = ({ job, isOpen, onClose }) => {
  console.log('TestModal rendered with:', { job, isOpen });

  if (!isOpen || !job) {
    console.log('TestModal not rendering:', { isOpen, jobExists: !!job });
    return null;
  }

  console.log('TestModal will render with job data:', job);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
      <div className="bg-white rounded-lg p-6 max-w-md">
        <h2 className="text-xl font-bold mb-4">Test Modal - Job Details</h2>
        <div className="mb-4 space-y-2">
          <p><strong>Job ID:</strong> {job.id || 'N/A'}</p>
          <p><strong>Job Number:</strong> {job.jobNumber || 'N/A'}</p>
          <p><strong>Customer Name:</strong> {job.customer_name || job.customerName || 'N/A'}</p>
          <p><strong>Customer Phone:</strong> {job.customer?.phone || job.customerPhone || 'N/A'}</p>
          <p><strong>Vehicle Model:</strong> {job.vehicle_model || job.vehicle || 'N/A'}</p>
          <p><strong>Vehicle Year:</strong> {job.vehicle_year || job.vehicleYear || 'N/A'}</p>
          <p><strong>Service Description:</strong> {job.service_description || job.serviceDescription || 'N/A'}</p>
          <p><strong>Status:</strong> {job.status || 'N/A'}</p>
          <p><strong>Priority:</strong> {job.priority || 'N/A'}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Close
          </button>
          <button
            onClick={() => console.log('Full job object:', JSON.stringify(job, null, 2))}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Log Full Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestModal;