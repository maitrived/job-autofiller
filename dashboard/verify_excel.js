const ExcelJS = require('exceljs');
const fs = require('fs');

const EXCEL_PATH = 'D:\\Job Applications\\Job_Status.xlsx';

async function verify() {
    try {
        if (!fs.existsSync(EXCEL_PATH)) {
            console.log('File does not exist: ' + EXCEL_PATH);
            return;
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(EXCEL_PATH);

        console.log('Workbook Sheets: ' + workbook.worksheets.map(s => s.name).join(', '));

        workbook.eachSheet((worksheet) => {
            console.log(`\nSheet: ${worksheet.name}`);
            console.log(`Row count: ${worksheet.actualRowCount}`);
            worksheet.eachRow((row, rowNumber) => {
                const values = row.values.slice(1); // Row values are 1-indexed
                console.log(`Row ${rowNumber}: ${JSON.stringify(values)}`);
            });
        });
    } catch (error) {
        console.error('Verification Error:', error);
    }
}

verify();
