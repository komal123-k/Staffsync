# StaffSync HR Management System

## Features
- Dashboard with total employees, active employees, present count, pending leaves and payroll summary
- Add, view, edit and delete employee profiles
- Employee search and department/status filters
- Export employee directory to CSV
- Date-based attendance tracking
- Submit, approve and reject leave requests
- Payroll payment status tracking
- Automatically saves data in browser LocalStorage
- Responsive desktop and mobile layout

## Run in VS Code
1. Extract `StaffSync_Complete.zip`.
2. Open the extracted `StaffSync_Complete` folder in VS Code.
3. Open Terminal > New Terminal.
4. Run:
   ```bash
   npm install
   npm run dev
   ```
5. Open the localhost address shown in the terminal (usually `http://localhost:5173`).

## If you already have a StaffSync folder
Make a backup first. You can copy `src/App.jsx` and `src/App.css` from this project into your existing `staffsync/src` folder, replacing those two files. Keep your existing `package.json` if your project already runs. Ensure `lucide-react` is installed by running `npm install lucide-react` in the project folder.

## Data note
This app stores records in LocalStorage in the current browser. Export employee data regularly using the Export CSV button. This is a front-end learning project and does not use a secure server/database or multiple-user login.
