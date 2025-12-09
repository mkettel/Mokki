import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail({
  to,
  houseName,
  inviterName,
  signUpUrl,
}: {
  to: string;
  houseName: string;
  inviterName: string;
  signUpUrl: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Mökki <onboarding@resend.dev>",
      to: [to],
      subject: `You're invited to join ${houseName} on Mökki`,
      html: getInviteEmailHtml({ houseName, inviterName, signUpUrl }),
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendExpenseTaggedEmail({
  to,
  recipientName,
  payerName,
  expenseTitle,
  totalAmount,
  yourShare,
  houseName,
  expenseUrl,
}: {
  to: string;
  recipientName: string;
  payerName: string;
  expenseTitle: string;
  totalAmount: number;
  yourShare: number;
  houseName: string;
  expenseUrl: string;
}) {
  try {
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Mökki <onboarding@resend.dev>",
      to: [to],
      subject: `${payerName} added you to an expense - ${formatCurrency(yourShare)}`,
      html: getExpenseTaggedEmailHtml({
        recipientName,
        payerName,
        expenseTitle,
        totalAmount: formatCurrency(totalAmount),
        yourShare: formatCurrency(yourShare),
        houseName,
        expenseUrl,
      }),
    });

    if (error) {
      console.error("Error sending expense email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending expense email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

function getExpenseTaggedEmailHtml({
  recipientName,
  payerName,
  expenseTitle,
  totalAmount,
  yourShare,
  houseName,
  expenseUrl,
}: {
  recipientName: string;
  payerName: string;
  expenseTitle: string;
  totalAmount: string;
  yourShare: string;
  houseName: string;
  expenseUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Expense Added</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #000; font-size: 28px; margin: 0;">🏔️ Mökki</h1>
    <p style="color: #666; margin-top: 5px;">Your ski house, organized.</p>
  </div>

  <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
    <h2 style="margin-top: 0; color: #000;">New Expense Added</h2>
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi ${recipientName || "there"},<br><br>
      <strong>${payerName}</strong> added an expense that includes you in <strong>${houseName}</strong>.
    </p>

    <div style="background-color: #fff; border-radius: 6px; padding: 20px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
      <h3 style="margin: 0 0 10px 0; color: #000;">${expenseTitle}</h3>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span style="color: #666;">Total:</span>
        <span style="font-weight: 500;">${totalAmount}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #e5e7eb;">
        <span style="color: #666;">Your share:</span>
        <span style="font-weight: 600; color: #dc2626;">${yourShare}</span>
      </div>
    </div>

    <a href="${expenseUrl}" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">
      View Expense
    </a>
  </div>

  <div style="text-align: center; color: #999; font-size: 14px;">
    <p>This expense was added to ${houseName} on Mökki.</p>
  </div>
</body>
</html>
  `.trim();
}

function getInviteEmailHtml({
  houseName,
  inviterName,
  signUpUrl,
}: {
  houseName: string;
  inviterName: string;
  signUpUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to ${houseName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #000; font-size: 28px; margin: 0;">🏔️ Mökki</h1>
    <p style="color: #666; margin-top: 5px;">Your ski house, organized.</p>
  </div>

  <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
    <h2 style="margin-top: 0; color: #000;">You're Invited!</h2>
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${inviterName}</strong> has invited you to join <strong>${houseName}</strong> on Mökki.
    </p>
    <p style="color: #666; margin-bottom: 25px;">
      Mökki helps you coordinate stays, split expenses, and stay connected with your ski house group.
    </p>
    <a href="${signUpUrl}" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">
      Accept Invitation
    </a>
  </div>

  <div style="text-align: center; color: #999; font-size: 14px;">
    <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    <p style="margin-top: 20px;">
      <a href="${signUpUrl}" style="color: #666; text-decoration: underline;">
        ${signUpUrl}
      </a>
    </p>
  </div>
</body>
</html>
  `.trim();
}
