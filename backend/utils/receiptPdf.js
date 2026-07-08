const PDFDocument = require('pdfkit');

// live payments.id and archived_payments.id are separate sequences and can
// collide numerically, so tag which table a receipt number came from.
function formatReceiptNumber(id, source = 'live') {
    const padded = String(id).padStart(6, '0');
    return source === 'archived' ? `RCP-A${padded}` : `RCP-${padded}`;
}

// Streams a receipt PDF to `res`. Resolves once fully written.
function generateReceiptPdf(res, {
    receiptNumber,
    schoolName,
    studentIdCode,
    studentName,
    fatherName,
    className,
    academicYear,
    amountPaid,
    paymentMethod,
    paymentDate,
}) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        doc.on('error', reject);
        res.on('finish', resolve);
        doc.pipe(res);

        doc.fontSize(20).text(schoolName || 'School', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(14).fillColor('gray').text('Payment Receipt', { align: 'center' });
        doc.fillColor('black');
        doc.moveDown(1.5);

        doc.fontSize(10);
        doc.text(`Receipt No: ${receiptNumber}`);
        doc.text(`Date: ${new Date(paymentDate).toLocaleDateString()}`);
        doc.text(`Academic Year: ${academicYear || 'N/A'}`);
        doc.moveDown(1);

        doc.fontSize(12).text('Student Information', { underline: true });
        doc.fontSize(10);
        doc.text(`Student ID: ${studentIdCode || 'N/A'}`);
        doc.text(`Student Name: ${studentName || 'N/A'}`);
        doc.text(`Father's Name: ${fatherName || 'N/A'}`);
        doc.text(`Class: ${className || 'N/A'}`);
        doc.moveDown(1);

        doc.fontSize(12).text('Payment Details', { underline: true });
        doc.fontSize(10);
        doc.text(`Amount Paid: $${parseFloat(amountPaid).toFixed(2)}`);
        doc.text(`Payment Method: ${paymentMethod || 'N/A'}`);
        doc.moveDown(2);

        doc.fontSize(9).fillColor('gray').text('This is a computer-generated receipt.', { align: 'center' });

        doc.end();
    });
}

module.exports = { generateReceiptPdf, formatReceiptNumber };
