/**
 * Direct SMTP probe — bypasses the Next.js bundle so we see raw Gmail errors.
 *
 *   npm exec tsx scripts/smtp-test.ts -- <to-email>
 *
 * Reads SMTP_* from process env. Prints verify result + send result. On
 * failure, dumps the full nodemailer error object so we can see Gmail's
 * actual response code (535 auth, 550 rejected, 421 throttled, etc.).
 */
import nodemailer from 'nodemailer';

async function main() {
  const to = process.argv[2] || process.env.SMTP_USER;
  if (!to) { console.error('Usage: smtp-test.ts <to-email>'); process.exit(1); }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  console.log('SMTP_HOST    =', SMTP_HOST);
  console.log('SMTP_PORT    =', SMTP_PORT);
  console.log('SMTP_USER    =', SMTP_USER);
  console.log('SMTP_PASSWORD=', SMTP_PASSWORD ? `***${SMTP_PASSWORD.length} chars***` : '(missing)');
  console.log('SMTP_FROM    =', SMTP_FROM);
  console.log('to           =', to);
  console.log();

  const t = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    logger: true,
    debug: true,
  });

  console.log('→ verify() …');
  await t.verify();
  console.log('✓ verify OK\n');

  console.log('→ sendMail() …');
  const info = await t.sendMail({
    from: SMTP_FROM,
    to,
    subject: 'Dharsan Dresses SMTP probe ' + new Date().toISOString(),
    text: 'If you see this, SMTP is working end-to-end.',
    html: '<p>If you see this, SMTP is working end-to-end.</p>',
  });
  console.log('✓ sendMail OK');
  console.log('  messageId :', info.messageId);
  console.log('  response  :', info.response);
  console.log('  accepted  :', info.accepted);
  console.log('  rejected  :', info.rejected);
}

main().catch((e) => {
  console.error('✗ FAILED');
  console.error('  code     :', e.code);
  console.error('  command  :', e.command);
  console.error('  response :', e.response);
  console.error('  message  :', e.message);
  process.exit(1);
});
