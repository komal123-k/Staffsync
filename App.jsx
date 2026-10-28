import { useEffect, useMemo, useState } from 'react'
import {
  Users, CalendarCheck, Wallet, CreditCard, UserRoundPlus,
  Search, Pencil, Trash2, Eye, X, CheckCircle2, Clock3,
  LayoutDashboard, UserRound, CalendarDays, ClipboardList,
  Download, Building2, BriefcaseBusiness
} from 'lucide-react'
import './App.css'

const STORAGE = {
  employees: 'staffsync-employees',
  attendance: 'staffsync-attendance',
  leaves: 'staffsync-leaves',
  payroll: 'staffsync-payroll',
}

const starterEmployees = [
  { id: 'emp-rahul', name: 'Rahul Sharma', department: 'IT', position: 'Developer', status: 'Active', salary: 35000, email: 'rahul@example.com', phone: '' },
  { id: 'emp-priya', name: 'Priya Verma', department: 'HR', position: 'HR Executive', status: 'Active', salary: 30000, email: 'priya@example.com', phone: '' },
  { id: 'emp-aman', name: 'Aman Patel', department: 'Finance', position: 'Accountant', status: 'On Leave', salary: 28000, email: 'aman@example.com', phone: '' },
]

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function App() {
  const [employees, setEmployees] = useState(() => {
    const stored = readStorage(STORAGE.employees, null)
    const source = stored || starterEmployees
    return source.map((employee, index) => ({
      ...employee,
      id: employee.id || `legacy-${index}-${String(employee.name || 'employee').toLowerCase().replace(/\s+/g, '-')}`,
      email: employee.email || '',
      phone: employee.phone || '',
      salary: Number(employee.salary || 0),
      status: employee.status || 'Active',
    }))
  })
  const [attendance, setAttendance] = useState(() => readStorage(STORAGE.attendance, {}))
  const [leaves, setLeaves] = useState(() => readStorage(STORAGE.leaves, []))
  const [payroll, setPayroll] = useState(() => {
    const stored = readStorage(STORAGE.payroll, null)
    if (stored) {
      return stored.map((item, index) => {
        const matchingEmployee = employees.find(employee => employee.id === item.id || employee.name === item.name)
        return { ...item, id: item.id || matchingEmployee?.id || `legacy-payroll-${index}`, salary: Number(item.salary || matchingEmployee?.salary || 0) }
      })
    }
    return starterEmployees.map(employee => ({
      id: employee.id, name: employee.name, salary: employee.salary, status: 'Pending'
    }))
  })

  const [activeSection, setActiveSection] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [employeeModal, setEmployeeModal] = useState(null)
  const [viewEmployee, setViewEmployee] = useState(null)
  const [leaveName, setLeaveName] = useState('')
  const [leaveDays, setLeaveDays] = useState('1')
  const [leaveReason, setLeaveReason] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(todayKey())
  const [toast, setToast] = useState('')

  useEffect(() => { localStorage.setItem(STORAGE.employees, JSON.stringify(employees)) }, [employees])
  useEffect(() => { localStorage.setItem(STORAGE.attendance, JSON.stringify(attendance)) }, [attendance])
  useEffect(() => { localStorage.setItem(STORAGE.leaves, JSON.stringify(leaves)) }, [leaves])
  useEffect(() => { localStorage.setItem(STORAGE.payroll, JSON.stringify(payroll)) }, [payroll])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  const departments = useMemo(() => ['All', ...new Set(employees.map(e => e.department).filter(Boolean))], [employees])
  const filteredEmployees = employees.filter(employee => {
    const query = search.toLowerCase().trim()
    const matchesSearch = [employee.name, employee.department, employee.position, employee.email]
      .some(value => String(value || '').toLowerCase().includes(query))
    return matchesSearch &&
      (departmentFilter === 'All' || employee.department === departmentFilter) &&
      (statusFilter === 'All' || employee.status === statusFilter)
  })

  const todayAttendance = attendance[attendanceDate] || {}
  const presentCount = employees.filter(employee => todayAttendance[employee.id] === 'Present').length
  const absentCount = employees.filter(employee => todayAttendance[employee.id] === 'Absent').length
  const activeCount = employees.filter(employee => employee.status === 'Active').length
  const pendingLeaves = leaves.filter(leave => leave.status === 'Pending').length
  const totalSalary = employees.reduce((sum, employee) => sum + Number(employee.salary || 0), 0)
  const paidSalary = payroll.filter(item => item.status === 'Paid').reduce((sum, item) => sum + Number(item.salary || 0), 0)
  const pendingSalary = payroll.filter(item => item.status !== 'Paid').reduce((sum, item) => sum + Number(item.salary || 0), 0)

  function notify(message) {
    setToast(message)
  }

  function saveEmployee(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const employee = {
      id: employeeModal?.mode === 'edit' ? employeeModal.employee.id : makeId(),
      name: String(form.get('name') || '').trim(),
      department: String(form.get('department') || '').trim(),
      position: String(form.get('position') || '').trim(),
      email: String(form.get('email') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      salary: Number(form.get('salary') || 0),
      status: String(form.get('status') || 'Active'),
    }
    if (!employee.name || !employee.department || !employee.position || !Number.isFinite(employee.salary) || employee.salary < 0) {
      notify('Please enter valid employee details.')
      return
    }

    if (employeeModal?.mode === 'edit') {
      const oldEmployee = employeeModal.employee
      setEmployees(previous => previous.map(item => item.id === employee.id ? employee : item))
      setPayroll(previous => previous.map(item => item.id === employee.id || item.name === oldEmployee.name
        ? { ...item, id: employee.id, name: employee.name, salary: employee.salary } : item))
      notify('Employee details updated.')
    } else {
      setEmployees(previous => [...previous, employee])
      setPayroll(previous => [...previous, { id: employee.id, name: employee.name, salary: employee.salary, status: 'Pending' }])
      notify('Employee added successfully.')
    }
    setEmployeeModal(null)
  }

  function deleteEmployee(employee) {
    if (!window.confirm(`Delete ${employee.name}? This will also remove their linked attendance and payroll records.`)) return
    setEmployees(previous => previous.filter(item => item.id !== employee.id))
    setPayroll(previous => previous.filter(item => item.id !== employee.id && item.name !== employee.name))
    setAttendance(previous => {
      const updated = { ...previous }
      Object.keys(updated).forEach(date => {
        if (updated[date] && typeof updated[date] === 'object') {
          const day = { ...updated[date] }
          delete day[employee.id]
          delete day[employee.name]
          updated[date] = day
        } else {
          delete updated[employee.name]
        }
      })
      return updated
    })
    setLeaves(previous => previous.filter(leave => leave.employeeId !== employee.id && leave.name !== employee.name))
    if (viewEmployee?.id === employee.id) setViewEmployee(null)
    notify('Employee and linked records deleted.')
  }

  function markAttendance(employeeId, status) {
    setAttendance(previous => ({
      ...previous,
      [attendanceDate]: { ...(previous[attendanceDate] || {}), [employeeId]: status },
    }))
    notify(`Attendance marked ${status.toLowerCase()}.`)
  }

  function addLeave(event) {
    event.preventDefault()
    const employee = employees.find(item => item.id === leaveName)
    if (!employee || Number(leaveDays) < 1) {
      notify('Select an employee and enter valid leave days.')
      return
    }
    setLeaves(previous => [...previous, {
      id: makeId(), employeeId: employee.id, name: employee.name,
      days: Number(leaveDays), reason: leaveReason.trim(), status: 'Pending',
      date: todayKey(),
    }])
    setLeaveName('')
    setLeaveDays('1')
    setLeaveReason('')
    notify('Leave request submitted.')
  }

  function updateLeave(id, status) {
    setLeaves(previous => previous.map(leave => leave.id === id ? { ...leave, status } : leave))
    notify(`Leave request ${status.toLowerCase()}.`)
  }

  function togglePayroll(item) {
    const nextStatus = item.status === 'Paid' ? 'Pending' : 'Paid'
    setPayroll(previous => previous.map(record => record.id === item.id ? { ...record, status: nextStatus } : record))
    notify(`Payment marked ${nextStatus.toLowerCase()}.`)
  }

  function exportEmployees() {
    const header = ['Name', 'Department', 'Position', 'Email', 'Phone', 'Status', 'Monthly Salary']
    const rows = employees.map(e => [e.name, e.department, e.position, e.email, e.phone, e.status, e.salary])
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'staffsync-employees.csv'
    link.click()
    URL.revokeObjectURL(url)
    notify('Employee CSV downloaded.')
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'leaves', label: 'Leave Management', icon: ClipboardList },
    { id: 'payroll', label: 'Payroll', icon: CreditCard },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><Building2 size={23} /></div>
        <div className="brand-copy"><h2>StaffSync</h2><p>HR Management</p></div>
        <nav className="side-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <a key={id} href={`#${id}`} className={activeSection === id ? 'active' : ''}
              onClick={() => setActiveSection(id)}>
              <Icon size={18} /><span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-footer"><div className="avatar">HR</div><div><strong>HR Admin</strong><span>Administrator</span></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><span className="eyebrow">WORKSPACE / PEOPLE</span><h1>HR Dashboard</h1><p>Manage your team, attendance, leave and payroll in one place.</p></div>
          <div className="topbar-actions"><span className="today-chip"><CalendarDays size={16} /> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span><button className="primary-btn" onClick={() => setEmployeeModal({ mode: 'add' })}><UserRoundPlus size={17} /> Add employee</button></div>
        </header>

        <section id="dashboard" className="section-anchor">
          <div className="summary-cards">
            <StatCard label="Total employees" value={employees.length} note="People in your workspace" icon={Users} tone="purple" />
            <StatCard label="Active employees" value={activeCount} note="Currently active" icon={UserRound} tone="green" />
            <StatCard label="Present today" value={presentCount} note={`${absentCount} marked absent`} icon={CalendarCheck} tone="blue" />
            <StatCard label="Pending leaves" value={pendingLeaves} note="Awaiting decision" icon={Clock3} tone="orange" />
          </div>
          <div className="overview-grid">
            <section className="panel welcome-panel">
              <div className="panel-heading"><div><span className="eyebrow">OVERVIEW</span><h2>People at a glance</h2></div><span className="live-badge"><span /> Live data</span></div>
              <div className="overview-stats">
                <div><span className="stat-label">Monthly payroll</span><strong>{money(totalSalary)}</strong><small>Current employee salaries</small></div>
                <div><span className="stat-label">Salary paid</span><strong>{money(paidSalary)}</strong><small>Marked as paid</small></div>
                <div><span className="stat-label">Salary pending</span><strong>{money(pendingSalary)}</strong><small>Awaiting payment</small></div>
              </div>
              <div className="progress-area"><div className="progress-caption"><span>Payroll completion</span><strong>{totalSalary ? Math.round((paidSalary / totalSalary) * 100) : 0}%</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${totalSalary ? Math.min(100, (paidSalary / totalSalary) * 100) : 0}%` }} /></div></div>
            </section>
            <section className="panel quick-panel"><div className="panel-heading"><div><span className="eyebrow">QUICK ACTIONS</span><h2>Get things done</h2></div></div>
              <button className="quick-action" onClick={() => setEmployeeModal({ mode: 'add' })}><span className="quick-icon purple"><UserRoundPlus size={18} /></span><span><strong>Add an employee</strong><small>Create a new employee record</small></span><span className="arrow">↗</span></button>
              <a className="quick-action" href="#attendance" onClick={() => setActiveSection('attendance')}><span className="quick-icon blue"><CalendarCheck size={18} /></span><span><strong>Mark attendance</strong><small>Update today's attendance</small></span><span className="arrow">↗</span></a>
              <a className="quick-action" href="#leaves" onClick={() => setActiveSection('leaves')}><span className="quick-icon orange"><ClipboardList size={18} /></span><span><strong>Review leave requests</strong><small>{pendingLeaves} request(s) pending</small></span><span className="arrow">↗</span></a>
            </section>
          </div>
        </section>

        <section id="employees" className="panel section-anchor content-panel">
          <div className="section-heading"><div><span className="eyebrow">PEOPLE DIRECTORY</span><h2>Employee management</h2><p>Manage employee profiles and employment details.</p></div><div className="heading-actions"><button className="secondary-btn" onClick={exportEmployees}><Download size={16} /> Export CSV</button><button className="primary-btn" onClick={() => setEmployeeModal({ mode: 'add' })}><UserRoundPlus size={16} /> Add employee</button></div></div>
          <div className="filters-row"><label className="search-box"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, department, position..." /></label><select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} aria-label="Filter department">{departments.map(dept => <option key={dept}>{dept}</option>)}</select><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter status"><option>All</option><option>Active</option><option>On Leave</option><option>Inactive</option></select></div>
          <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Department / Role</th><th>Monthly salary</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {filteredEmployees.map(employee => <tr key={employee.id}>
              <td><div className="employee-cell"><div className="employee-avatar">{employee.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</div><div><strong>{employee.name}</strong><small>{employee.email || 'No email added'}</small></div></div></td>
              <td><strong className="normal-weight">{employee.department}</strong><small className="table-subtext">{employee.position}</small></td>
              <td className="salary-cell">{money(employee.salary)}</td><td><StatusBadge status={employee.status} /></td>
              <td><div className="row-actions"><button className="icon-btn" title="View employee" aria-label="View employee" onClick={() => setViewEmployee(employee)}><Eye size={16} /></button><button className="icon-btn" title="Edit employee" aria-label="Edit employee" onClick={() => setEmployeeModal({ mode: 'edit', employee })}><Pencil size={16} /></button><button className="icon-btn danger" title="Delete employee" aria-label="Delete employee" onClick={() => deleteEmployee(employee)}><Trash2 size={16} /></button></div></td>
            </tr>)}
            {filteredEmployees.length === 0 && <tr><td colSpan="5" className="empty-state">No employees match your search.</td></tr>}
          </tbody></table></div><div className="table-footer"><span>Showing <strong>{filteredEmployees.length}</strong> of <strong>{employees.length}</strong> employees</span><span>Changes save automatically on this browser</span></div>
        </section>

        <section id="attendance" className="panel section-anchor content-panel">
          <div className="section-heading"><div><span className="eyebrow">DAILY TRACKING</span><h2>Attendance management</h2><p>Record attendance for a selected date.</p></div><label className="date-field">Attendance date<input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} /></label></div>
          <div className="mini-stats"><div><span className="mini-dot green-dot" /> Present <strong>{presentCount}</strong></div><div><span className="mini-dot red-dot" /> Absent <strong>{absentCount}</strong></div><div><span className="mini-dot gray-dot" /> Not marked <strong>{employees.length - presentCount - absentCount}</strong></div></div>
          <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Department</th><th>Current status</th><th>Mark attendance</th></tr></thead><tbody>
            {employees.map(employee => <tr key={employee.id}><td><div className="employee-cell"><div className="employee-avatar">{employee.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</div><strong>{employee.name}</strong></div></td><td>{employee.department}</td><td><StatusBadge status={todayAttendance[employee.id] || 'Not Marked'} /></td><td><div className="attendance-actions"><button className={todayAttendance[employee.id] === 'Present' ? 'attendance-btn present selected' : 'attendance-btn present'} onClick={() => markAttendance(employee.id, 'Present')}><CheckCircle2 size={15} /> Present</button><button className={todayAttendance[employee.id] === 'Absent' ? 'attendance-btn absent selected' : 'attendance-btn absent'} onClick={() => markAttendance(employee.id, 'Absent')}><X size={15} /> Absent</button></div></td></tr>)}
            {employees.length === 0 && <tr><td colSpan="4" className="empty-state">Add employees to start taking attendance.</td></tr>}
          </tbody></table></div>
        </section>

        <section id="leaves" className="panel section-anchor content-panel">
          <div className="section-heading"><div><span className="eyebrow">TIME OFF</span><h2>Leave management</h2><p>Submit, approve or reject employee leave requests.</p></div></div>
          <form className="leave-form" onSubmit={addLeave}><label>Employee<select value={leaveName} onChange={e => setLeaveName(e.target.value)} required><option value="">Select employee</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label><label>Leave days<input type="number" min="1" max="365" value={leaveDays} onChange={e => setLeaveDays(e.target.value)} required /></label><label className="reason-field">Reason (optional)<input value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="e.g. Personal work" /></label><button className="primary-btn" type="submit" disabled={employees.length === 0}><ClipboardList size={16} /> Submit request</button></form>
          <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Requested on</th><th>Days</th><th>Reason</th><th>Status</th><th>Decision</th></tr></thead><tbody>
            {leaves.map(leave => <tr key={leave.id}><td><strong>{leave.name}</strong></td><td>{leave.date || '—'}</td><td>{leave.days}</td><td>{leave.reason || '—'}</td><td><StatusBadge status={leave.status} /></td><td>{leave.status === 'Pending' ? <div className="row-actions"><button className="small-success" onClick={() => updateLeave(leave.id, 'Approved')}>Approve</button><button className="small-danger" onClick={() => updateLeave(leave.id, 'Rejected')}>Reject</button></div> : <span className="muted-text">Decision recorded</span>}</td></tr>)}
            {leaves.length === 0 && <tr><td colSpan="6" className="empty-state">No leave requests yet.</td></tr>}
          </tbody></table></div>
        </section>

        <section id="payroll" className="panel section-anchor content-panel">
          <div className="section-heading"><div><span className="eyebrow">COMPENSATION</span><h2>Payroll management</h2><p>Track monthly salary and payment status.</p></div></div>
          <div className="payroll-summary"><div><span><Wallet size={17} /> Monthly payroll</span><strong>{money(totalSalary)}</strong></div><div><span><CheckCircle2 size={17} /> Paid</span><strong>{money(paidSalary)}</strong></div><div><span><Clock3 size={17} /> Pending</span><strong>{money(pendingSalary)}</strong></div></div>
          <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Monthly salary</th><th>Payment status</th><th>Action</th></tr></thead><tbody>
            {payroll.filter(item => employees.some(employee => employee.id === item.id) || employees.some(employee => employee.name === item.name)).map(item => <tr key={item.id || item.name}><td><div className="employee-cell"><div className="employee-avatar">{item.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</div><strong>{item.name}</strong></div></td><td className="salary-cell">{money(item.salary)}</td><td><StatusBadge status={item.status} /></td><td><button className={item.status === 'Paid' ? 'secondary-btn compact' : 'primary-btn compact'} onClick={() => togglePayroll(item)}>{item.status === 'Paid' ? 'Mark pending' : 'Mark paid'}</button></td></tr>)}
            {payroll.length === 0 && <tr><td colSpan="4" className="empty-state">No payroll records available.</td></tr>}
          </tbody></table></div>
        </section>

        <footer className="footer"><div className="footer-brand"><Building2 size={17} /> StaffSync</div><span>HR Management System · Your people, in sync.</span></footer>
      </main>

      {employeeModal && <EmployeeModal mode={employeeModal.mode} employee={employeeModal.employee} onClose={() => setEmployeeModal(null)} onSave={saveEmployee} />}
      {viewEmployee && <ViewModal employee={viewEmployee} onClose={() => setViewEmployee(null)} onEdit={() => { setEmployeeModal({ mode: 'edit', employee: viewEmployee }); setViewEmployee(null) }} />}
      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  )
}

function StatCard({ label, value, note, icon: Icon, tone }) {
  return <div className="stat-card"><div className="stat-card-top"><span>{label}</span><div className={`stat-icon ${tone}`}><Icon size={20} /></div></div><strong className="stat-number">{value}</strong><small>{note}</small></div>
}

function StatusBadge({ status }) {
  const normalized = String(status || 'Not Marked').toLowerCase().replace(/\s+/g, '-')
  return <span className={`status-badge status-${normalized}`}>{status || 'Not Marked'}</span>
}

function EmployeeModal({ mode, employee, onClose, onSave }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="employee-modal-title"><div className="modal-heading"><div><span className="eyebrow">{mode === 'edit' ? 'UPDATE RECORD' : 'NEW RECORD'}</span><h2 id="employee-modal-title">{mode === 'edit' ? 'Edit employee' : 'Add employee'}</h2><p>Enter the employee information below.</p></div><button className="close-btn" onClick={onClose} aria-label="Close"><X size={20} /></button></div><form className="modal-form" onSubmit={onSave}>
    <label>Full name *<input name="name" defaultValue={employee?.name || ''} placeholder="e.g. Aditi Sharma" required autoFocus /></label>
    <label>Department *<input name="department" defaultValue={employee?.department || ''} placeholder="e.g. Engineering" required /></label>
    <label>Position *<input name="position" defaultValue={employee?.position || ''} placeholder="e.g. Software Engineer" required /></label>
    <label>Monthly salary (₹) *<input name="salary" type="number" min="0" step="1" defaultValue={employee?.salary ?? ''} placeholder="30000" required /></label>
    <label>Email<input name="email" type="email" defaultValue={employee?.email || ''} placeholder="name@company.com" /></label>
    <label>Phone<input name="phone" type="tel" defaultValue={employee?.phone || ''} placeholder="Phone number" /></label>
    <label className="full-width">Employment status<select name="status" defaultValue={employee?.status || 'Active'}><option>Active</option><option>On Leave</option><option>Inactive</option></select></label>
    <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button type="submit" className="primary-btn">{mode === 'edit' ? 'Save changes' : 'Add employee'}</button></div>
  </form></section></div>
}

function ViewModal({ employee, onClose, onEdit }) {
  const initials = employee.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="modal-card view-modal" role="dialog" aria-modal="true" aria-labelledby="view-modal-title"><div className="profile-header"><button className="close-btn" onClick={onClose} aria-label="Close"><X size={20} /></button><div className="profile-avatar">{initials}</div><h2 id="view-modal-title">{employee.name}</h2><p>{employee.position}</p><StatusBadge status={employee.status} /></div><div className="profile-details"><ProfileItem label="Department" value={employee.department} /><ProfileItem label="Monthly salary" value={money(employee.salary)} /><ProfileItem label="Email" value={employee.email || 'Not provided'} /><ProfileItem label="Phone" value={employee.phone || 'Not provided'} /><ProfileItem label="Employee ID" value={employee.id} /></div><div className="modal-actions"><button className="secondary-btn" onClick={onClose}>Close</button><button className="primary-btn" onClick={onEdit}><Pencil size={15} /> Edit profile</button></div></section></div>
}

function ProfileItem({ label, value }) {
  return <div className="profile-item"><span>{label}</span><strong>{value}</strong></div>
}

export default App
