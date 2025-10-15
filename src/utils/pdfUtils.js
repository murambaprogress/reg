/**
 * PDF Utilities for consistent invoice and document generation
 * Provides standardized functions for adding headers, footers, and formatting
 */

// Helper to add a standardized footer to PDF documents
export const addStandardFooter = (doc, pageWidth, pageHeight) => {
  // Set footer style
  doc.setFontSize(12); // Increased font size for better visibility
  doc.setFont('helvetica', 'normal');
  
  // Calculate footer position - significantly increased space from bottom
  const footerY = pageHeight - 220; // More space from bottom
  
  // Email
  const emailText = 'Email: tinashe@regimarkauto.co.zw';
  const emailWidth = doc.getTextWidth(emailText);
  doc.text(emailText, (pageWidth - emailWidth) / 2, footerY);
  
  // Address
  const addressText = '85 Plymouth Road, Southerton, Harare';
  const addressWidth = doc.getTextWidth(addressText);
  doc.text(addressText, (pageWidth - addressWidth) / 2, footerY + 15);
  
  // Bold services text
  doc.setFont('helvetica', 'bold');
  const servicesText = 'For all your auto electricals & computer diagnostics';
  const servicesWidth = doc.getTextWidth(servicesText);
  doc.text(servicesText, (pageWidth - servicesWidth) / 2, footerY + 30);
  
  // Secondary services
  const injectionText = 'Petrol & Diesel Injection';
  const injectionWidth = doc.getTextWidth(injectionText);
  doc.text(injectionText, (pageWidth - injectionWidth) / 2, footerY + 45);
  
  // Phone numbers
  doc.setFont('helvetica', 'bold'); // Make phone numbers bold
  doc.setFontSize(13); // Larger font for phone numbers
  const phoneText = '+263 772 980 161 / +263 719 980 161 / +263 732 980 161';
  const phoneWidth = doc.getTextWidth(phoneText);
  doc.text(phoneText, (pageWidth - phoneWidth) / 2, footerY + 70); // More spacing
  
  // Add a line above the footer
  doc.setLineWidth(0.5);
  doc.line(40, footerY - 15, pageWidth - 40, footerY - 15);
  
  return footerY - 30; // Return the y-position where content should end to avoid overlapping with footer
};

// Helper to add a standardized header to PDF documents
export const addStandardHeader = (doc, pageWidth, title) => {
  // Implementation for standardized headers
  // ...
};

// Format currency consistently
export const formatCurrency = (amount) => {
  return `$${Number(amount || 0).toFixed(2)}`;
};