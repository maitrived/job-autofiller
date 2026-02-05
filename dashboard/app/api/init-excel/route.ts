import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const EXCEL_PATH = 'D:\\Job Applications\\Job_Status.xlsx';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const dateObj = new Date();
        const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        const dateString = dateObj.toISOString().split('T')[0];

        let workbook = new ExcelJS.Workbook();

        // Ensure directory exists
        const dir = path.dirname(EXCEL_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (fs.existsSync(EXCEL_PATH)) {
            await workbook.xlsx.readFile(EXCEL_PATH);
        }

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

        return NextResponse.json({ success: true, message: 'Excel file initialized at ' + EXCEL_PATH });
    } catch (error: any) {
        console.error('Excel Init Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
