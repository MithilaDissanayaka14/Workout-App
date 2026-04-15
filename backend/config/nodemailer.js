import nodemailer from 'nodemailer';
import 'dotenv/config';

console.log(process.env.SMTP_USER);
// Configure Nodemailer to use Brevo
const transporter = nodemailer.createTransport({

    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    tls : {rejectUnauthorized: false},
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
    
});

export default transporter; 