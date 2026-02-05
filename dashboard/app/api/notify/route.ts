import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, siteName, details } = body;

        // Note: For real use, these should be in .env.local
        // For now, using placeholders as planned
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'maitrideepakved@gmail.com',
                pass: process.env.EMAIL_APP_PASSWORD // Expected in env
            }
        });

        let subject = '';
        let text = '';

        if (type === 'missing_account') {
            subject = `Action Needed: Login required for ${siteName}`;
            text = `
Hello,

The Job Autofiller encountered a page on ${siteName} that requires a login or a new account.
No saved credentials were found for this site.

Please go to the tab and create an account or sign in. 
I have paused the application and will wait for you to click "Continue" on the page.

Happy Job Hunting!
            `;
        } else {
            subject = `Update from Job Autofiller`;
            text = details || 'An event occurred that might need your attention.';
        }

        if (!process.env.EMAIL_APP_PASSWORD) {
            console.warn('EMAIL_APP_PASSWORD not set. Skipping real mail send.');
            return NextResponse.json({
                success: true,
                message: 'Notification logged (Mail skipped: No password set)'
            });
        }

        await transporter.sendMail({
            from: 'maitrideepakved@gmail.com',
            to: 'maitrideepakved@gmail.com',
            subject: subject,
            text: text
        });

        return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } catch (error: any) {
        console.error('Notification Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
