import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tucorreo@gmail.com",
    pass: "tu_contraseña_app_segura",
  },
});

class EmailService {
  async enviarCorreo(to, subject, message) {
    return transporter.sendMail({
      from: '"PsicoApp" <tucorreo@gmail.com>',
      to,
      subject,
      text: message,
    });
  }
}

export default new EmailService();
