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
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; align-items: center; justify-content: center;">
                        <span style="color: white; font-weight: bold; font-size: 18px;">N</span>
                    </div>
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
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; align-items: center; justify-content: center;">
                        <span style="color: white; font-weight: bold; font-size: 18px;">N</span>
                    </div>
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

def send_password_reset_email(user_email: str, user_name: str, reset_token: str):
    """Send password reset email using SendGrid"""
    
    try:
        sg = SendGridAPIClient(api_key="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")
        
        # Create reset URL
        reset_url = url_for('auth.reset_password_form', token=reset_token, _external=True)
        
        # Create email content with Nexus AI Hub branding
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password - Nexus AI Hub</title>
        </head>
        <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #e2e8f0; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; align-items: center; place-content: center; box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);">
                        <span style="color: white; font-weight: bold; font-size: 26px;">N</span>
                    </div>
                </div>
                <p style="color: #94a3b8; margin: 0; font-size: 16px;">Your AI-Powered Workspace</p>
            </div>
            
            <div style="background: #f0f8ff; padding: 40px; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);">
                <h2 style="color: #333; margin-bottom: 24px; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
                
                <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hi {user_name},</p>
                
                <p style="color: #333; font-size: 16px;">We received a request to reset your password for your Nexus AI Hub account. Click the button below to create a new password:</p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="{reset_url}" 
                       style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
                              color: white; 
                              padding: 16px 32px; 
                              text-decoration: none; 
                              border-radius: 12px; 
                              font-weight: 600; 
                              font-size: 16px;
                              display: inline-block;
                              box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
                              transition: all 0.3s ease;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #333; font-size: 14px; margin-top: 25px; padding: 16px; border-radius: 8px; border-left: 3px solid #f59e0b;">
                    ⚠️ This link will expire in 1 hour for security reasons.
                </p>
                
                <p style="color: #333; font-size: 14px; margin-top: 20px;">
                    If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
                
                <p style="color: #333; font-size: 14px; margin-top: 20px;">
                    If the button above doesn't work, copy and paste this link into your browser:
                    <br>
                    <a href="{reset_url}" style="color: #6366f1; word-break: break-all; text-decoration: underline;">{reset_url}</a>
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155;">
                <p style="color: #64748b; font-size: 12px; margin: 0;">
                    © 2025 Nexus AI Hub. All rights reserved.
                </p>
                <p style="color: #64748b; font-size: 12px; margin: 8px 0 0 0;">
                    Build Intelligent AI Agents That Connect Everything
                </p>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_content = f"""
        Reset Your Password - Nexus AI Hub
        
        Hi {user_name},
        
        We received a request to reset your password for your Nexus AI Hub account.
        
        Click this link to create a new password (expires in 1 hour):
        {reset_url}
        
        If you didn't request a password reset, you can safely ignore this email.
        
        © 2025 Nexus AI Hub. All rights reserved.
        """
        
        message = Mail(
            from_email=Email("support@nexusaihub.co.in", "Nexus AI Hub"),
            to_emails=To(user_email),
            subject="Reset Your Password - Nexus AI Hub",
            html_content=Content("text/html", html_content),
            plain_text_content=Content("text/plain", text_content)
        )
        
        response = sg.send(message)
        logger.info(f"Password reset email sent to {user_email}, status code: {response.status_code}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user_email}: {str(e)}")
        return False