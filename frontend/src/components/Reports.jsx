import { useState, useEffect } from 'react'
import { api } from '../api'
import { useToast } from '../App'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Calendar,
  ArrowUpRight, ArrowDownRight, DollarSign, ShoppingCart, Hash, BarChart3,
  FileDown
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function formatMoney(n) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)
}

function formatMoneyPDF(n) {
  const formatted = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))
  const sign = n < 0 ? '-' : ''
  return `${sign}PHP ${formatted}`
}

function formatShort(n) {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toFixed(0)
}

function generatePDF(data) {
  const doc = new jsPDF()
  const s = data.summary
  const c = data.comparison
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  // Color palette
  const primary = [99, 102, 241]
  const dark = [15, 23, 42]
  const muted = [100, 116, 139]
  const green = [34, 197, 94]
  const red = [239, 68, 68]
  const white = [255, 255, 255]

  // ---- Header ----
  doc.setFillColor(...primary)
  doc.rect(0, 0, pageWidth, 42, 'F')

  doc.setTextColor(...white)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Monthly Financial Report', 14, 18)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.month_name} ${data.year}`, 14, 28)

  doc.setFontSize(8)
  doc.text(`Generated on ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 36)

  y = 54

  // ---- Summary Section ----
  doc.setTextColor(...dark)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 14, y)
  y += 3

  // Summary cards
  const cardWidth = (pageWidth - 38) / 4
  const cards = [
    { label: 'Total Income', value: formatMoneyPDF(s.total_income), color: green },
    { label: 'Total Expenses', value: formatMoneyPDF(s.total_expenses), color: red },
    { label: 'Net Savings', value: formatMoneyPDF(s.net), color: s.net >= 0 ? green : red },
    { label: 'Avg Daily Spend', value: formatMoneyPDF(s.avg_daily_spending), color: muted },
  ]

  cards.forEach((card, i) => {
    const x = 14 + i * (cardWidth + 4)
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(x, y, cardWidth, 26, 2, 2, 'F')

    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...muted)
    doc.text(card.label.toUpperCase(), x + 4, y + 8)

    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...card.color)
    doc.text(card.value, x + 4, y + 18)
  })

  y += 34

  // Quick stats
  doc.setTextColor(...dark)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const statsLine = `Total Transactions: ${s.total_transactions}  |  Income Entries: ${s.income_transactions}  |  Expense Entries: ${s.expense_transactions}`
  doc.text(statsLine, 14, y)
  y += 10

  // ---- Month-over-Month ----
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...dark)
  doc.text('Month-over-Month Comparison', 14, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Metric', data.month_name, c.prev_month_name, 'Change']],
    body: [
      [
        'Income',
        formatMoneyPDF(s.total_income),
        formatMoneyPDF(c.prev_income),
        `${c.income_change >= 0 ? '+' : ''}${c.income_change}%`,
      ],
      [
        'Expenses',
        formatMoneyPDF(s.total_expenses),
        formatMoneyPDF(c.prev_expenses),
        `${c.expense_change >= 0 ? '+' : ''}${c.expense_change}%`,
      ],
      [
        'Net Savings',
        formatMoneyPDF(s.net),
        formatMoneyPDF(c.prev_net),
        '--',
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.3, overflow: 'ellipsize' },
    headStyles: { fillColor: primary, textColor: white, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 45, halign: 'right' },
      2: { cellWidth: 45, halign: 'right' },
      3: { cellWidth: 30, halign: 'center' },
    },
    tableWidth: 'wrap',
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 12

  // ---- Expense Breakdown ----
  if (data.category_breakdown.length > 0) {
    if (y > 240) { doc.addPage(); y = 20 }

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...dark)
    doc.text('Expense Breakdown by Category', 14, y)
    y += 4

    const catBody = data.category_breakdown.map((cat, i) => [
      `${i + 1}`,
      cat.name,
      cat.count.toString(),
      formatMoneyPDF(cat.total),
      `${cat.percentage}%`,
      formatMoneyPDF(cat.avg_per_transaction),
    ])

    autoTable(doc, {
      startY: y,
      head: [['#', 'Category', 'Count', 'Total', '%', 'Avg/Txn']],
      body: catBody,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.3, overflow: 'ellipsize' },
      headStyles: { fillColor: primary, textColor: white, fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 38, halign: 'right' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 38, halign: 'right' },
      },
      tableWidth: 'auto',
      margin: { left: 14, right: 14 },
    })

    y = doc.lastAutoTable.finalY + 12
  }

  // ---- Income Breakdown ----
  if (data.income_breakdown.length > 0) {
    if (y > 240) { doc.addPage(); y = 20 }

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...dark)
    doc.text('Income Sources', 14, y)
    y += 4

    const incBody = data.income_breakdown.map((cat, i) => [
      `${i + 1}`,
      cat.name,
      cat.count.toString(),
      formatMoneyPDF(cat.total),
      `${cat.percentage}%`,
    ])

    autoTable(doc, {
      startY: y,
      head: [['#', 'Source', 'Entries', 'Total', '%']],
      body: incBody,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.3, overflow: 'ellipsize' },
      headStyles: { fillColor: green, textColor: white, fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 42, halign: 'right' },
        4: { cellWidth: 20, halign: 'center' },
      },
      tableWidth: 'auto',
      margin: { left: 14, right: 14 },
    })

    y = doc.lastAutoTable.finalY + 12
  }

  // ---- Daily Breakdown ----
  if (y > 200) { doc.addPage(); y = 20 }

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...dark)
  doc.text('Daily Breakdown', 14, y)
  y += 4

  const dailyBody = data.daily_breakdown
    .filter((d) => d.income > 0 || d.expenses > 0)
    .map((d) => [
      d.date,
      formatMoneyPDF(d.income),
      formatMoneyPDF(d.expenses),
      formatMoneyPDF(d.income - d.expenses),
    ])

  if (dailyBody.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Income', 'Expenses', 'Net']],
      body: dailyBody,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2, lineColor: [226, 232, 240], lineWidth: 0.3, overflow: 'ellipsize' },
      headStyles: { fillColor: primary, textColor: white, fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
      tableWidth: 'auto',
      margin: { left: 14, right: 14 },
    })

    y = doc.lastAutoTable.finalY + 12
  }

  // ---- Top Expenses ----
  if (data.top_expenses.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...dark)
    doc.text('Top 10 Expenses', 14, y)
    y += 4

    const topBody = data.top_expenses.map((t, i) => [
      `${i + 1}`,
      t.description,
      t.category_name,
      t.date,
      formatMoneyPDF(t.amount),
    ])

    autoTable(doc, {
      startY: y,
      head: [['#', 'Description', 'Category', 'Date', 'Amount']],
      body: topBody,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.3, overflow: 'ellipsize' },
      headStyles: { fillColor: red, textColor: white, fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 55 },
        2: { cellWidth: 35 },
        3: { cellWidth: 28 },
        4: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
      },
      tableWidth: 'auto',
      margin: { left: 14, right: 14 },
    })
  }

  // ---- Footer on every page ----
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    const pageH = doc.internal.pageSize.getHeight()
    doc.setFillColor(248, 250, 252)
    doc.rect(0, pageH - 14, pageWidth, 14, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.line(0, pageH - 14, pageWidth, pageH - 14)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...muted)
    doc.text('FinTrack - Personal Finance Tracker', 14, pageH - 5)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageH - 5, { align: 'right' })
  }

  doc.save(`FinTrack_Report_${data.month_name}_${data.year}.pdf`)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(8, 12, 24, 0.96)',
      border: '1px solid rgba(40, 55, 85, 0.6)',
      borderRadius: 12,
      padding: '0.7rem 1rem',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: '#556178', fontSize: '0.7rem', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.5 }}>
          {entry.name}: {formatMoney(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function Reports() {
  const showToast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const load = async () => {
    setLoading(true)
    try {
      const report = await api.getMonthlyReport(year, month)
      setData(report)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [year, month])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else setMonth(month - 1)
  }

  const nextMonth = () => {
    const now = new Date()
    if (year === now.getFullYear() && month === now.getMonth() + 1) return
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else setMonth(month + 1)
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  if (loading || !data) {
    return (
      <div>
        <div className="page-header"><h2>Monthly Report</h2></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 500 }}>Generating report...</p>
          </div>
        </div>
      </div>
    )
  }

  const s = data.summary
  const c = data.comparison

  return (
    <div>
      {/* Header with month navigation */}
      <div className="page-header">
        <h2>Monthly Report</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={() => generatePDF(data)}>
            <FileDown size={16} /> Export PDF
          </button>
          <button className="btn btn-secondary btn-sm" onClick={prevMonth}>
            <ChevronLeft size={16} />
          </button>
          <div style={{
            padding: '0.5rem 1.25rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minWidth: 170,
            justifyContent: 'center',
          }}>
            <Calendar size={15} style={{ color: 'var(--accent-light)' }} />
            {data.month_name} {data.year}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={nextMonth} disabled={isCurrentMonth} style={{ opacity: isCurrentMonth ? 0.4 : 1 }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>
            <ArrowUpRight size={18} />
          </div>
          <div className="label">Total Income</div>
          <div className="value positive">{formatMoney(s.total_income)}</div>
          <div className={`stat-change ${c.income_change >= 0 ? 'up' : 'down'}`}>
            {c.income_change >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(c.income_change)}% vs {c.prev_month_name}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171' }}>
            <ArrowDownRight size={18} />
          </div>
          <div className="label">Total Expenses</div>
          <div className="value negative">{formatMoney(s.total_expenses)}</div>
          <div className={`stat-change ${c.expense_change <= 0 ? 'up' : 'down'}`}>
            {c.expense_change <= 0 ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
            {Math.abs(c.expense_change)}% vs {c.prev_month_name}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
            <DollarSign size={18} />
          </div>
          <div className="label">Net Savings</div>
          <div className={`value ${s.net >= 0 ? 'positive' : 'negative'}`}>{formatMoney(s.net)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
            <ShoppingCart size={18} />
          </div>
          <div className="label">Avg Daily Spend</div>
          <div className="value" style={{ color: 'var(--text-primary)' }}>{formatMoney(s.avg_daily_spending)}</div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Transactions', value: s.total_transactions, icon: Hash, color: 'var(--accent-light)' },
          { label: 'Income Entries', value: s.income_transactions, icon: ArrowUpRight, color: 'var(--green)' },
          { label: 'Expense Entries', value: s.expense_transactions, icon: ArrowDownRight, color: 'var(--red)' },
          { label: 'Highest Day', value: s.highest_spending_amount > 0 ? formatMoney(s.highest_spending_amount) : '--', icon: BarChart3, color: 'var(--yellow)' },
        ].map((item, i) => (
          <div key={i} style={{
            flex: 1,
            minWidth: 150,
            padding: '0.85rem 1rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <item.icon size={16} style={{ color: item.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: 2, letterSpacing: '-0.02em' }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Spending Chart */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <h3>Daily Activity</h3>
        </div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.daily_breakdown} barGap={1}>
              <defs>
                <linearGradient id="rIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="rExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(40,55,85,0.15)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#556178', fontSize: 10, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fill: '#556178', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={55}
                tickFormatter={(v) => formatShort(v)}
              />
              <Tooltip content={<CustomTooltip />} labelFormatter={(v) => `Day ${v}`} />
              <Bar dataKey="income" fill="url(#rIncomeGrad)" name="Income" radius={[3, 3, 0, 0]} maxBarSize={14} />
              <Bar dataKey="expenses" fill="url(#rExpenseGrad)" name="Expenses" radius={[3, 3, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        {/* Expense Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3>Expense Breakdown</h3>
          </div>
          {data.category_breakdown.length > 0 ? (
            <>
              <div style={{ width: '100%', height: 220, marginBottom: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.category_breakdown}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={52}
                      strokeWidth={2}
                      stroke="rgba(5, 8, 15, 0.9)"
                      paddingAngle={2}
                    >
                      {data.category_breakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {data.category_breakdown.map((cat, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.5rem 0.65rem',
                    borderRadius: 'var(--radius-xs)',
                    background: i === 0 ? 'var(--bg-surface)' : 'transparent',
                  }}>
                    <span className="cat-dot" style={{ backgroundColor: cat.color, margin: 0, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.835rem', fontWeight: 500 }}>{cat.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{cat.count}x</span>
                    <span style={{ fontSize: '0.835rem', fontWeight: 700, minWidth: 80, textAlign: 'right' }}>{formatMoney(cat.total)}</span>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
                      background: 'var(--bg-surface)', padding: '0.15rem 0.45rem', borderRadius: 100,
                      minWidth: 42, textAlign: 'center',
                    }}>{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>No expenses this month</p>
              <p className="empty-subtitle">Start tracking to see your breakdown</p>
            </div>
          )}
        </div>

        {/* Income Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3>Income Sources</h3>
          </div>
          {data.income_breakdown.length > 0 ? (
            <>
              <div style={{ width: '100%', height: 220, marginBottom: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.income_breakdown}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={52}
                      strokeWidth={2}
                      stroke="rgba(5, 8, 15, 0.9)"
                      paddingAngle={2}
                    >
                      {data.income_breakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {data.income_breakdown.map((cat, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.5rem 0.65rem',
                    borderRadius: 'var(--radius-xs)',
                    background: i === 0 ? 'var(--bg-surface)' : 'transparent',
                  }}>
                    <span className="cat-dot" style={{ backgroundColor: cat.color, margin: 0, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.835rem', fontWeight: 500 }}>{cat.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{cat.count}x</span>
                    <span style={{ fontSize: '0.835rem', fontWeight: 700, minWidth: 80, textAlign: 'right' }}>{formatMoney(cat.total)}</span>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
                      background: 'var(--bg-surface)', padding: '0.15rem 0.45rem', borderRadius: 100,
                      minWidth: 42, textAlign: 'center',
                    }}>{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>No income this month</p>
              <p className="empty-subtitle">Income entries will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Month over Month Comparison */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <h3>Month-over-Month Comparison</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          {[
            { label: 'Income', current: s.total_income, previous: c.prev_income, change: c.income_change, goodUp: true },
            { label: 'Expenses', current: s.total_expenses, previous: c.prev_expenses, change: c.expense_change, goodUp: false },
            { label: 'Net', current: s.net, previous: c.prev_net, change: null, goodUp: true },
          ].map((item, i) => {
            const isGood = item.change !== null ? (item.goodUp ? item.change >= 0 : item.change <= 0) : item.current >= item.previous
            return (
              <div key={i} style={{
                padding: '1.25rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                  {item.label}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{data.month_name}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{formatMoney(item.current)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{c.prev_month_name}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{formatMoney(item.previous)}</div>
                  </div>
                </div>
                {item.change !== null && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    fontSize: '0.73rem', fontWeight: 700,
                    padding: '0.2rem 0.5rem', borderRadius: 100,
                    background: isGood ? 'var(--green-bg)' : 'var(--red-bg)',
                    color: isGood ? 'var(--green)' : 'var(--red)',
                    border: `1px solid ${isGood ? 'var(--green-border)' : 'var(--red-border)'}`,
                  }}>
                    {item.change >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {Math.abs(item.change)}%
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Expenses */}
      <div className="card">
        <div className="card-header">
          <h3>Top Expenses</h3>
        </div>
        {data.top_expenses.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 30 }}>#</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.top_expenses.map((txn, i) => (
                  <tr key={txn.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{txn.description}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="cat-dot" style={{ backgroundColor: txn.category_color, margin: 0 }} />
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{txn.category_name}</span>
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>{txn.date}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-expense">{formatMoney(txn.amount)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No expenses this month</p>
          </div>
        )}
      </div>
    </div>
  )
}
