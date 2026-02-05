import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const EXCEL_PATH = 'D:\\Job Applications\\Job_Status.xlsx';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { company, position, newStatus } = body;

        if (!fs.existsSync(EXCEL_PATH)) {
            return NextResponse.json({ success: false, error: 'Excel file not found' }, { status: 404 });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(EXCEL_PATH);

        let found = false;

        // Iterate through all sheets to find the application
        workbook.eachSheet((worksheet) => {
            worksheet.eachRow((row, rowNumber) => {
                const rowCompany = row.getCell(1).value?.toString() || '';
                const rowPosition = row.getCell(2).value?.toString() || '';

                if (rowCompany.toLowerCase().includes(company.toLowerCase()) &&
                    rowPosition.toLowerCase().includes(position.toLowerCase())) {

                    const statusCell = row.getCell(3);
                    const oldStatus = statusCell.value?.toString();

                    if (oldStatus?.toLowerCase() !== newStatus.toLowerCase()) {
                        statusCell.value = newStatus.toUpperCase();

                        // Update formatting
                        if (newStatus.toLowerCase().includes('consideration') || newStatus.toLowerCase().includes('interview')) {
                            statusCell.font = { color: { argb: 'FF10B981' }, bold: true }; // Green
                        } else if (newStatus.toLowerCase().includes('rejected') || newStatus.toLowerCase().includes('not selected')) {
                            statusCell.font = { color: { argb: 'FFEF4444' }, bold: true }; // Red
                        }

                        found = true;
                    }
                }
            });
        });

        if (found) {
            await workbook.xlsx.writeFile(EXCEL_PATH);
            return NextResponse.json({ success: true, message: 'Status updated in Excel' });
        }

        return NextResponse.json({ success: false, message: 'Job not found in Excel' });
    } catch (error: any) {
        console.error('Excel Update Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
