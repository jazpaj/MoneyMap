import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useToast } from '../App'
import { Upload, Download, FileSpreadsheet } from 'lucide-react'

export default function ImportExport() {
  const showToast = useToast()
  const fileRef = useRef()
  const [accounts, setAccounts] = useState([])
  const [accountId, setAccountId] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [exportStart, setExportStart] = useState('')
  const [exportEnd, setExportEnd] = useState('')

  useEffect(() => {
    api.getAccounts().then((a) => {
      setAccounts(a)
      if (a.length > 0) setAccountId(a[0].id)
    })
  }, [])

  const handleImport = async () => {
    const file = fileRef.current?.files[0]
    if (!file) {
      showToast('Select a CSV file first', 'error')
      return
    }
    setImporting(true)
    setResult(null)
    try {
      const res = await api.importCSV(file, accountId)
      setResult(res)
      showToast(`Imported ${res.imported} transactions`)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setImporting(false)
    }
  }

  const handleExport = async () => {
    try {
      const blob = await api.exportCSV(exportStart, exportEnd)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'transactions.csv'
      a.click()
      URL.revokeObjectURL(url)
      showToast('Export downloaded')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Import / Export</h2>
      </div>

      <div className="grid-2">
        {/* Import */}
        <div className="card">
          <div className="card-header">
            <h3><Upload size={16} style={{ marginRight: 6 }} /> Import CSV</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Upload a CSV file with columns: date, description, amount, type (income/expense), category.
            Flexible column mapping is supported.
          </p>
          <div className="form-group">
            <label>Account</label>
            <select className="form-input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>CSV File</label>
            <input ref={fileRef} type="file" accept=".csv" className="form-input" style={{ padding: '0.5rem' }} />
          </div>
          <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
            <FileSpreadsheet size={16} />
            {importing ? 'Importing...' : 'Import'}
          </button>
          {result && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: 'var(--green)', fontSize: '0.85rem' }}>
                Successfully imported {result.imported} transactions
              </p>
              {result.errors.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ color: 'var(--yellow)', fontSize: '0.8rem' }}>Warnings:</p>
                  {result.errors.map((e, i) => (
                    <p key={i} style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export */}
        <div className="card">
          <div className="card-header">
            <h3><Download size={16} style={{ marginRight: 6 }} /> Export CSV</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Download all your transactions as a CSV file. Optionally filter by date range.
          </p>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date (optional)</label>
              <input className="form-input" type="date" value={exportStart} onChange={(e) => setExportStart(e.target.value)} />
            </div>
            <div className="form-group">
              <label>End Date (optional)</label>
              <input className="form-input" type="date" value={exportEnd} onChange={(e) => setExportEnd(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>
    </div>
  )
}
