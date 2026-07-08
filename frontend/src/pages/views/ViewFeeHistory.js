import React, { useEffect, useState } from 'react';
import classService from '../../services/classService';
import downloadFile from '../../utils/downloadFile';

const ViewFeeHistory = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadReceipt = async (paymentId) => {
    setDownloadingId(paymentId);
    try {
      const res = await classService.getArchivedReceiptPdf(paymentId);
      downloadFile(res.data, `receipt-${paymentId}.pdf`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to download receipt.');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    // Fetch all classes (current + historical)
    classService.getAllClassesForHistory().then(res => setClasses(res.data)).catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setYears([]);
    setSelectedYear('');
    setStudents([]);
    setError('');
    setLoading(true);
    classService.getFeeHistoryYears(selectedClass)
      .then(res => {
        setYears(res.data.years);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedClass]);

  const handleView = async () => {
    if (!selectedClass || !selectedYear) return;
    setLoading(true);
    setError('');
    setStudents([]);
    try {
      const res = await classService.getFeeHistory(selectedClass, selectedYear);
      setStudents(res.data.students);
    } catch (err) {
      setError('Failed to fetch fee history.');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>View Fee History</h2>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
          <option value="">Select Class</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} disabled={!years.length}>
          <option value="">Select Year</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={handleView} disabled={!selectedClass || !selectedYear}>View</button>
      </div>
      {selectedClass && !loading && years.length === 0 && (
        <div style={{ color: '#666', marginBottom: '1rem' }}>
          No archived fee history yet — this appears after your first year-end session rollover.
        </div>
      )}
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {students.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Father's Name</th>
                <th>Phone</th>
                <th>Prev. Balance</th>
                <th>Final Balance</th>
                <th>Status</th>
                <th>Payments</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td>{s.student_id}</td>
                  <td>{s.name}</td>
                  <td>{s.father_name}</td>
                  <td>{s.phone}</td>
                  <td>${parseFloat(s.previous_year_balance).toFixed(2)}</td>
                  <td>${parseFloat(s.final_balance).toFixed(2)}</td>
                  <td>{s.status}</td>
                  <td>
                    {s.payments && s.payments.length > 0 ? (
                      <ul style={{ paddingLeft: 16 }}>
                        {s.payments.map((p) => (
                          <li key={p.id} style={p.voided_at ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}>
                            {new Date(p.payment_date).toLocaleDateString()} - ${parseFloat(p.amount_paid).toFixed(2)} ({p.payment_method})
                            {p.voided_at ? (
                              <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}> (Voided)</span>
                            ) : (
                              <button
                                style={{ marginLeft: '0.5rem' }}
                                disabled={downloadingId === p.id}
                                onClick={() => handleDownloadReceipt(p.id)}
                              >
                                {downloadingId === p.id ? 'Downloading...' : 'Receipt'}
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : 'No payments'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewFeeHistory; 