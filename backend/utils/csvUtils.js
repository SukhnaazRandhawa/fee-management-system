function escapeCsvField(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// columns: [{ key, label, format? }] - format(rawValue) transforms the cell
// before it's stringified, e.g. for dates or numbers.
function toCsv(rows, columns) {
    const header = columns.map(c => escapeCsvField(c.label)).join(',');
    const lines = rows.map(row =>
        columns.map(c => {
            const raw = row[c.key];
            const value = c.format ? c.format(raw) : raw;
            return escapeCsvField(value);
        }).join(',')
    );
    return [header, ...lines].join('\r\n');
}

module.exports = { toCsv };
