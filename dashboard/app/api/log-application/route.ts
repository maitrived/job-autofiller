import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const EXCEL_PATH = 'D:\\Job Applications\\Job_Status.xlsx';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { company, position, status, appLink, jdLink, qaLog, appliedDate } = body;

        const dateObj = new Date(appliedDate || new Date());
        const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        const dateString = dateObj.toISOString().split('T')[0];

        let workbook = new ExcelJS.Workbook();
        if (fs.existsSync(EXCEL_PATH)) {
            await workbook.xlsx.readFile(EXCEL_PATH);
        }

        let worksheet = workbook.getWorksheet(monthName);
        if (!worksheet) {
            worksheet = workbook.addWorksheet(monthName);
            // ROW 1: Monthly Total
            const totalRow = worksheet.addRow(['TOTAL APPLICATIONS (MONTH):', 0]);
            totalRow.font = { bold: true, size: 12 };
            totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Yellow

            worksheet.addRow([]); // Spacer

            // Headers
            const headerRow = worksheet.addRow([
                'Company', 'Position', 'Status', 'Application Link', 'JD Link', 'Q&A Details'
            ]);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

            worksheet.getColumn(1).width = 30;
            worksheet.getColumn(2).width = 30;
            worksheet.getColumn(3).width = 20;
            worksheet.getColumn(4).width = 35;
            worksheet.getColumn(5).width = 35;
            worksheet.getColumn(6).width = 60;
        }

        // 1. Update Monthly Total
        const monthTotalCell = worksheet.getRow(1).getCell(2);
        const currentMonthTotal = parseInt(monthTotalCell.value?.toString() || '0');
        monthTotalCell.value = currentMonthTotal + 1;

        // 2. Find or Create Daily Section
        let dateHeaderRow: ExcelJS.Row | null = null;
        let foundDate = false;

        // Search backwards for the most recent date header
        for (let i = worksheet.rowCount; i > 1; i--) {
            const val = worksheet.getRow(i).getCell(1).value?.toString() || '';
            if (val.startsWith('--- DATE:')) {
                if (val.includes(dateString)) {
                    dateHeaderRow = worksheet.getRow(i);
                    foundDate = true;
                }
                break;
            }
        }

        if (!foundDate) {
            // Add 3 row gap if not the first day
            if (worksheet.rowCount > 5) {
                worksheet.addRow([]);
                worksheet.addRow([]);
                worksheet.addRow([]);
            }
            dateHeaderRow = worksheet.addRow([`--- DATE: ${dateString} | APPS TODAY: 1 ---`]);
            dateHeaderRow.font = { bold: true };
            dateHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
            worksheet.mergeCells(`A${dateHeaderRow.number}:F${dateHeaderRow.number}`);
        } else if (dateHeaderRow) {
            // Update daily count
            const val = dateHeaderRow.getCell(1).value?.toString() || '';
            const countMatch = val.match(/APPS TODAY: (\d+)/);
            if (countMatch) {
                const newCount = parseInt(countMatch[1]) + 1;
                dateHeaderRow.getCell(1).value = `--- DATE: ${dateString} | APPS TODAY: ${newCount} ---`;
            }
        }

        // 3. Add Application Row
        const appRow = worksheet.addRow([
            company,
            position,
            status.toUpperCase(),
            appLink,
            jdLink,
            ''
        ]);

        const statusCell = appRow.getCell(3);
        if (status.toLowerCase().includes('consideration') || status.toLowerCase().includes('applied')) {
            statusCell.font = { color: { argb: 'FF10B981' }, bold: true };
        } else if (status.toLowerCase().includes('rejected')) {
            statusCell.font = { color: { argb: 'FFEF4444' }, bold: true };
        }

        // 4. Add Q&A
        if (qaLog && Array.isArray(qaLog) && qaLog.length > 0) {
            qaLog.forEach((qa: any) => {
                const qaRow = worksheet.addRow(['', '', '', '', '', `${qa.question}: ${qa.answer}`]);
                qaRow.font = { italic: true, size: 9, color: { argb: 'FF6B7280' } };
            });
        }

        await workbook.xlsx.writeFile(EXCEL_PATH);
        return NextResponse.json({ success: true, message: 'Logged to Excel successfully' });
    } catch (error: any) {
        console.error('Excel Logging Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
