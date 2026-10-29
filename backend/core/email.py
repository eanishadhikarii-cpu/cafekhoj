import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_otp_verification_email(email: str = None, otp_code: str = '', first_name: str = '', recipient_email: str = None, recipient_name: str = '') -> bool:
    """
    Dispatches a branded 6-digit OTP verification email for CafeKhoj registration.
    Includes both HTML and plaintext alternatives. Never logs the OTP code.
    """
    email_address = (email or recipient_email or '').strip()
    name = (first_name or recipient_name or '').strip()
    if not email_address:
        logger.error("send_otp_verification_email called without an email address.")
        return False

    subject = "Verify your CafeKhoj account"
    from_email = getattr(
        settings, 'DEFAULT_FROM_EMAIL', 'CafeKhoj Registration <registration@cafekhoj.gmail.com>'
    )
    recipient_list = [email_address]

    greeting_name = f" {name}" if name else ""
    support_contact = getattr(settings, 'SUPPORT_EMAIL', 'support@cafekhoj.np')

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Verify your CafeKhoj account</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FBF9F5; margin: 0; padding: 24px; color: #2B1810; }}
    .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #E8DFD1; overflow: hidden; box-shadow: 0 4px 16px rgba(43,24,16,0.06); }}
    .header {{ background-color: #2B1810; padding: 28px 24px; text-align: center; }}
    .logo {{ color: #C88A4A; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; text-decoration: none; }}
    .logo-alt {{ color: #FBF9F5; }}
    .subhead {{ color: #A89F91; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }}
    .content {{ padding: 32px 28px; }}
    h1 {{ font-size: 20px; margin: 0 0 16px; color: #2B1810; font-weight: 700; }}
    p {{ font-size: 14px; line-height: 1.6; color: #5C4A3E; margin: 0 0 20px; }}
    .otp-box {{ background-color: #FBF9F5; border: 2px dashed #C88A4A; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }}
    .otp-code {{ font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #2B1810; margin: 0; }}
    .expiry {{ font-size: 12px; color: #C88A4A; font-weight: 600; margin-top: 8px; }}
    .notice {{ background: #FFF5EC; border-left: 4px solid #C88A4A; padding: 12px 16px; border-radius: 4px; font-size: 12px; color: #7A5328; margin: 20px 0; }}
    .footer {{ padding: 20px 28px; background: #F6F2EB; border-top: 1px solid #E8DFD1; font-size: 11px; color: #8C7B70; text-align: center; line-height: 1.5; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Cafe<span class="logo-alt">Khoj</span></div>
      <div class="subhead">Jhapa, Nepal &bull; Production Platform</div>
    </div>
    <div class="content">
      <h1>Verify your email address</h1>
      <p>Hello{greeting_name},</p>
      <p>Welcome to <strong>CafeKhoj</strong>. To complete your Cafe Operator registration and verify your account, please enter the one-time verification code below:</p>
      
      <div class="otp-box">
        <div class="otp-code">{otp_code}</div>
        <div class="expiry">&bull; Valid for 5 minutes only &bull;</div>
      </div>

      <div class="notice">
        <strong>Security Notice:</strong> Never share this code with anyone. CafeKhoj staff will never ask for your verification code.
      </div>

      <p>If you did not request this registration, you can safely disregard this email.</p>
    </div>
    <div class="footer">
      CafeKhoj Nepal &bull; Connecting coffee enthusiasts with certified local spaces.<br>
      Need assistance? Contact support at {support_contact}
    </div>
  </div>
</body>
</html>"""

    text_content = (
        f"Verify your CafeKhoj account\n\n"
        f"Hello{greeting_name},\n\n"
        f"Your verification code is: {otp_code}\n\n"
        f"This code will expire in 5 minutes.\n"
        f"Do not share this code with anyone.\n\n"
        f"If you did not request this code, please ignore this message.\n\n"
        f"Support: {support_contact}\n"
    )

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=recipient_list
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info(f"OTP verification email successfully dispatched to {email_address}")
        return True
    except Exception as exc:
        logger.error(f"Failed to dispatch OTP verification email to {email_address}: {exc}")
        return False
