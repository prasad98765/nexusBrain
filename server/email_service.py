import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from flask import current_app, url_for
import logging

logger = logging.getLogger(__name__)

def send_verification_email(user_email: str, user_name: str, verification_token: str):
    """Send email verification link using SendGrid"""
    
    try:
        sg = SendGridAPIClient(api_key="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")
        
        # Create verification URL
        verification_url = url_for('auth.verify_email', token=verification_token, _external=True)
        
        # Create email content with Nexus AI Hub branding
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email - Nexus AI Hub</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-weight: bold; font-size: 18px;">N</span>
                    </div>
                    <h1 style="color: #333; margin: 0; font-size: 24px; font-weight: 600;">Nexus AI Hub</h1>
                </div>
            </div>
            
            <div style="background: #f8f9ff; padding: 30px; border-radius: 10px; border-left: 4px solid #667eea;">
                <h2 style="color: #333; margin-bottom: 20px;">Welcome to Nexus AI Hub, {user_name}!</h2>
                
                <p>Thank you for signing up! To get started with your AI-powered workspace, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; 
                              padding: 12px 30px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-weight: 600; 
                              display: inline-block;
                              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 25px;">
                    If you didn't create an account with Nexus AI Hub, you can safely ignore this email.
                </p>
                
                <p style="color: #666; font-size: 14px;">
                    If the button above doesn't work, copy and paste this link into your browser:
                    <br>
                    <a href="{verification_url}" style="color: #667eea; word-break: break-all;">{verification_url}</a>
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                    © 2025 Nexus AI Hub. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_content = f"""
        Welcome to Nexus AI Hub, {user_name}!
        
        Thank you for signing up! To get started with your AI-powered workspace, please verify your email address by visiting this link:
        
        {verification_url}
        
        If you didn't create an account with Nexus AI Hub, you can safely ignore this email.
        
        © 2025 Nexus AI Hub. All rights reserved.
        """
        
        message = Mail(
            from_email=Email("support@nexusaihub.co.in", "Nexus AI Hub"),
            to_emails=To(user_email),
            subject="Verify Your Email - Welcome to Nexus AI Hub",
            html_content=Content("text/html", html_content),
            plain_text_content=Content("text/plain", text_content)
        )
        
        response = sg.send(message)
        logger.info(f"Verification email sent to {user_email}, status code: {response.status_code}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {user_email}: {str(e)}")
        return False

def send_welcome_email(user_email: str, user_name: str):
    """Send welcome email after successful verification"""
    
    try:
        sg = SendGridAPIClient(api_key="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")
        frontend_host = os.getenv("FRONTEND_HOST", "http://localhost:5174/")

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Nexus AI Hub</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-weight: bold; font-size: 18px;">N</span>
                    </div>
                    <h1 style="color: #333; margin: 0; font-size: 24px; font-weight: 600;">Nexus AI Hub</h1>
                </div>
            </div>
            
            <div style="background: #f0f8ff; padding: 30px; border-radius: 10px; border-left: 4px solid #4caf50;">
                <h2 style="color: #333; margin-bottom: 20px;">🎉 Welcome aboard, {user_name}!</h2>
                
                <p>Your email has been verified successfully! You're now ready to explore the power of AI-driven conversations and workspace collaboration.</p>
                
                <h3 style="color: #333; margin-top: 25px;">What's Next?</h3>
                <ul style="color: #666; padding-left: 20px;">
                    <li>Create your first workspace to organize your AI conversations</li>
                    <li>Start chatting with advanced AI models</li>
                    <li>Collaborate with team members in shared workspaces</li>
                    <li>Explore different AI models and conversation styles</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{frontend_host}" 
                       style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); 
                              color: white; 
                              padding: 12px 30px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-weight: 600; 
                              display: inline-block;
                              box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);">
                        Get Started
                    </a>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                    © 2025 Nexus AI Hub. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        """
        
        message = Mail(
            from_email=Email("support@nexusaihub.co.in", "Nexus AI Hub"),
            to_emails=To(user_email),
            subject="🎉 Welcome to Nexus AI Hub - You're All Set!",
            html_content=Content("text/html", html_content)
        )
        
        response = sg.send(message)
        logger.info(f"Welcome email sent to {user_email}, status code: {response.status_code}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user_email}: {str(e)}")
        return False