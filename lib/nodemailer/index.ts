import nodemailer from 'nodemailer';
import { WELCOME_EMAIL_TEMPLATE } from './templates';
import { CONDITION_OPTIONS } from '../constants';

export const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    },
});

export const sendWelcomeEmail = async ({email,name,intro}:WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
    .replace('{{name}}',name)
    .replace('{{intro}}',intro);
    const mailOptions = {
        from: `"Signalist" <signalist@gmail.com>`,
        to: email,
        subject: `Welcome to Signalist - you stock market toolkit is ready`,
        text:'Thanks for joining Signalist',
        html: htmlTemplate,
    };
    await transporter.sendMail(mailOptions);
}