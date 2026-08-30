export function printFeeReceipt(fee) {
  const status = fee.amountPaid >= fee.totalDue ? "Full Payment" : fee.amountPaid > 0 ? "Part Payment" : "Unpaid";
  const html = `
    <html>
      <head>
        <title>Receipt - ${fee.studentName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #333; max-width: 400px; margin: 0 auto; }
          h2 { text-align: center; color: #1f4d3a; }
          .divider { border-top: 2px solid #1f4d3a; border-bottom: 2px solid #1f4d3a; padding: 14px 0; margin: 14px 0; }
          p { margin: 6px 0; }
        </style>
      </head>
      <body>
        <h2>Payment Receipt</h2>
        <div class="divider">
          <p><strong>Receipt No:</strong> ${fee.id.slice(0, 8).toUpperCase()}</p>
          <p><strong>Student:</strong> ${fee.studentName}</p>
          <p><strong>Class:</strong> ${fee.classLevel}</p>
          <p><strong>Fee Type:</strong> ${fee.feeType}</p>
          <p><strong>Term:</strong> ${fee.term}</p>
          <p><strong>Amount Paid:</strong> ₦${fee.amountPaid.toLocaleString()}</p>
          <p><strong>Total Due:</strong> ₦${fee.totalDue.toLocaleString()}</p>
          <p><strong>Status:</strong> ${status}</p>
          <p><strong>Date:</strong> ${new Date(fee.date).toLocaleDateString()}</p>
        </div>
      </body>
    </html>
  `;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}