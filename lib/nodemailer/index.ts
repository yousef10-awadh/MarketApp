import nodemailer from 'nodemailer';
import { WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE } from './templates';
import { CONDITION_OPTIONS } from '../constants';
import { getFormattedTodayDate } from '../utils';

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
/// The AI Modification

export const sendNewsEmail = async ({email,date,newsContent}:{email:string,date:string,newsContent:string}) => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
    .replace('{{date}}',date)
    .replace('{{newsContent}}',newsContent);
    const mailOptions = {
        from: `"Signalist" <signalist@gmail.com>`,
        to: email,
        subject: `Market News Summary Today - ${date}`,
        text:'Your daily market news summary',
        html: htmlTemplate,
    };
    await transporter.sendMail(mailOptions);
}