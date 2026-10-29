const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function printFeeReceipt(fee) {
  const paid = Number(fee.amountPaid) || 0;
  const due = Number(fee.totalDue) || 0;
  const status = paid >= due ? "Full Payment" : paid > 0 ? "Part Payment" : "Unpaid";

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt - ${esc(fee.studentName)}</title>
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
      <p><strong>Receipt No:</strong> ${esc(String(fee.id || "").slice(0, 8).toUpperCase())}</p>
      <p><strong>Student:</strong> ${esc(fee.studentName)}</p>
      <p><strong>Class:</strong> ${esc(fee.classLevel)}</p>
      <p><strong>Fee Type:</strong> ${esc(fee.feeType)}</p>
      <p><strong>Term:</strong> ${esc(fee.term)}</p>
      <p><strong>Amount Paid:</strong> ₦${paid.toLocaleString()}</p>
      <p><strong>Total Due:</strong> ₦${due.toLocaleString()}</p>
      <p><strong>Status:</strong> ${status}</p>
      <p><strong>Date:</strong> ${esc(new Date(fee.date).toLocaleDateString())}</p>
    </div>
  </body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) {
    alert("Please allow pop-ups for this site, then try again.");
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}