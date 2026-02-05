const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const EXCEL_PATH = 'D:\\Job Applications\\Job_Status.xlsx';

async function init() {
    try {
        const dir = path.dirname(EXCEL_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const dateObj = new Date();
        const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

        let workbook = new ExcelJS.Workbook();
        if (fs.existsSync(EXCEL_PATH)) {
            await workbook.xlsx.readFile(EXCEL_PATH);
        }

        // Remove default sheets
        workbook.eachSheet((sheet) => {
            if (sheet.name === 'Sheet1' && sheet.actualRowCount === 0) {
                workbook.removeWorksheet(sheet.id);
            }
        });

        let worksheet = workbook.getWorksheet(monthName);
        if (!worksheet) {
            worksheet = workbook.addWorksheet(monthName);
            // ROW 1: Monthly Total
            const totalRow = worksheet.addRow(['TOTAL APPLICATIONS (MONTH):', 0]);
            totalRow.font = { bold: true, size: 12 };
            totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };

            worksheet.addRow([]); // Spacer

            // Headers
            const headerRow = worksheet.addRow([
                'Company', 'Position', 'Status', 'Application Link', 'JD Link', 'Q&A Details'
            ]);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4F46E5' }
            };
            worksheet.getColumn(1).width = 30;
            worksheet.getColumn(2).width = 30;
            worksheet.getColumn(3).width = 20;
            worksheet.getColumn(4).width = 35;
            worksheet.getColumn(5).width = 35;
            worksheet.getColumn(6).width = 60;
        }

        await workbook.xlsx.writeFile(EXCEL_PATH);
        console.log('Successfully re-initialized Excel with new layout at ' + EXCEL_PATH);
    } catch (error) {
        console.error('Error:', error);
    }
}

init();
