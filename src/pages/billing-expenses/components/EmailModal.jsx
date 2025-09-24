import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const EmailModal = ({ isOpen, onClose, invoice, onSendEmail }) => {
  const [emailData, setEmailData] = useState({
    recipient_email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  // Initialize with customer email and default message
  React.useEffect(() => {
    if (invoice && isOpen) {
      setEmailData({
        recipient_email: invoice.customer_email || '',
        subject: `Invoice ${invoice.invoice_number} - Regimark Motors`,
        message: `Dear ${invoice.customer_name || 'Customer'},

Please find attached your invoice #${invoice.invoice_number} from Regimark Motors.

Invoice Details:
- Invoice Number: ${invoice.invoice_number}
- Date: ${new Date(invoice.invoice_date).toLocaleDateString()}
- Total Amount: $${invoice.total_amount}
- Status: ${invoice.status}

If you have any questions, please contact us at rmakambe@gmail.com or +263 772 980 161.

Thank you for your business!

Regimark Motors
85 Plymouth Road, Southerton, Harare`
      });
    }
  }, [invoice, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!emailData.recipient_email.trim()) {
      alert('Please enter recipient email');
      return;
    }

    setLoading(true);
    try {
      await onSendEmail(invoice.id, emailData);
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Send Invoice via Email
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <Input
                label="Recipient Email"
                name="recipient_email"
                type="email"
                value={emailData.recipient_email}
                onChange={handleInputChange}
                placeholder="customer@example.com"
                required
              />
            </div>

            <div>
              <Input
                label="Subject"
                name="subject"
                value={emailData.subject}
                onChange={handleInputChange}
                placeholder="Invoice subject"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                name="message"
                value={emailData.message}
                onChange={handleInputChange}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
                placeholder="Enter your message..."
                required
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary text-primary-foreground"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Icon name="Loader" size={16} className="animate-spin" />
                Sending...
              </div>
            ) : (
              'Send Email'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
