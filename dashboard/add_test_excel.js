const ExcelJS = require('exceljs');
const fs = require('fs');

const EXCEL_PATH = 'D:\\Job Applications\\Job_Status.xlsx';

async function addTestEntry() {
    try {
        const dateObj = new Date();
        const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        const dateString = dateObj.toISOString().split('T')[0];

        let workbook = new ExcelJS.Workbook();
        if (fs.existsSync(EXCEL_PATH)) {
            await workbook.xlsx.readFile(EXCEL_PATH);
        }

        let worksheet = workbook.getWorksheet(monthName);
        if (!worksheet) {
            console.log('Worksheet not found. Please run init_excel.js first.');
            return;
        }

        // 1. Update Monthly Total (Row 1, Cell 2)
        const totalCell = worksheet.getRow(1).getCell(2);
        const currentTotal = parseInt(totalCell.value || '0');
        totalCell.value = currentTotal + 1;

        // 2. Add/Update Daily Header
        let dateHeaderRow = null;
        for (let i = worksheet.rowCount; i > 1; i--) {
            const val = worksheet.getRow(i).getCell(1).value?.toString() || '';
            if (val.startsWith('--- DATE:')) {
                if (val.includes(dateString)) {
                    dateHeaderRow = worksheet.getRow(i);
                }
                break;
            }
        }

        if (!dateHeaderRow) {
            if (worksheet.rowCount > 5) {
                worksheet.addRow([]); worksheet.addRow([]); worksheet.addRow([]);
            }
            dateHeaderRow = worksheet.addRow([`--- DATE: ${dateString} | APPS TODAY: 1 ---`]);
            dateHeaderRow.font = { bold: true };
            dateHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
            worksheet.mergeCells(`A${dateHeaderRow.number}:F${dateHeaderRow.number}`);
        } else {
            const val = dateHeaderRow.getCell(1).value.toString();
            const count = parseInt(val.match(/APPS TODAY: (\d+)/)[1]) + 1;
            dateHeaderRow.getCell(1).value = `--- DATE: ${dateString} | APPS TODAY: ${count} ---`;
        }

        // 3. Add Application Row
        const appRow = worksheet.addRow([
            'Refactored Corp',
            'Automation Engineer',
            'APPLIED',
            'https://linkedin.com/jobs/123',
            'https://linkedin.com/jd/123',
            'Q: Ready? A: Always.'
        ]);
        appRow.getCell(3).font = { color: { argb: 'FF10B981' }, bold: true };

        await workbook.xlsx.writeFile(EXCEL_PATH);
        console.log('Successfully tested new Excel layout at ' + EXCEL_PATH);
    } catch (error) {
        console.error('Error:', error);
    }
}

addTestEntry();
