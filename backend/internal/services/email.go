package services

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"net/smtp"
	"os"
	"strings"
	"time"
)

type EmailService struct {
	Host      string
	Port      string
	User      string
	Password  string
	FromEmail string
	FromName  string
}

var MailService *EmailService

func InitEmail() *EmailService {
	host := os.Getenv("SMTP_HOST")
	if host == "" {
		host = "smtp-relay.brevo.com"
	}

	port := os.Getenv("SMTP_PORT")
	if port == "" {
		port = "587"
	}

	user := os.Getenv("SMTP_USER")
	if user == "" {
		user = "c23985001@smtp-brevo.com"
	}

	password := os.Getenv("SMTP_PASSWORD")
	if password == "" {
		log.Printf("⚠️ SMTP_PASSWORD environment variable is not set; outgoing emails may fail authentication")
	}

	fromEmail := os.Getenv("SMTP_FROM_EMAIL")
	if fromEmail == "" {
		fromEmail = "c23985001@smtp-brevo.com"
	}

	fromName := os.Getenv("SMTP_FROM_NAME")
	if fromName == "" {
		fromName = "ComplianceHub Nigeria"
	}

	MailService = &EmailService{
		Host:      host,
		Port:      port,
		User:      user,
		Password:  password,
		FromEmail: fromEmail,
		FromName:  fromName,
	}

	log.Printf("📧 Email service initialized via Brevo SMTP (%s:%s as %s)", host, port, fromEmail)
	return MailService
}

func (s *EmailService) SendMail(to []string, subject string, htmlBody string) error {
	if s == nil {
		return fmt.Errorf("email service not initialized")
	}

	addr := fmt.Sprintf("%s:%s", s.Host, s.Port)
	auth := smtp.PlainAuth("", s.User, s.Password, s.Host)

	fromHeader := fmt.Sprintf("%s <%s>", s.FromName, s.FromEmail)
	toHeader := strings.Join(to, ", ")

	headers := make(map[string]string)
	headers["From"] = fromHeader
	headers["To"] = toHeader
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"
	headers["Date"] = time.Now().Format(time.RFC1123Z)

	var message bytes.Buffer
	for k, v := range headers {
		message.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	message.WriteString("\r\n")
	message.WriteString(htmlBody)

	err := smtp.SendMail(addr, auth, s.FromEmail, to, message.Bytes())
	if err != nil {
		log.Printf("❌ Failed sending email to %v: %v", to, err)
		return err
	}

	log.Printf("✅ Email successfully dispatched to %v [Subject: %s]", to, subject)
	return nil
}

// SendMailAsync dispatches email in a background goroutine so callers aren't blocked by network latency
func (s *EmailService) SendMailAsync(to []string, subject string, htmlBody string) {
	go func() {
		if err := s.SendMail(to, subject, htmlBody); err != nil {
			log.Printf("⚠️ Async mail dispatch error for %v: %v", to, err)
		}
	}()
}

// -------------------------------------------------------------
// Transactional Email Templates
// -------------------------------------------------------------

// SendWelcomeOnboardingEmail dispatches the official onboarding confirmation
func (s *EmailService) SendWelcomeOnboardingEmail(recipientEmail, recipientName, companyName, dashboardURL string, obligationsCount int, complianceScore int) error {
	subject := fmt.Sprintf("Welcome to ComplianceHub: %s Workspace Activated", companyName)

	tmpl := `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to ComplianceHub Nigeria</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; color: #1E293B; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; }
    .header { background: #0089C1; padding: 32px 24px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .card { background: #F1F5F9; border-radius: 14px; padding: 20px; margin: 24px 0; border: 1px solid #E2E8F0; }
    .stat-row { display: flex; justify-content: space-between; border-bottom: 1px solid #CBD5E1; padding: 8px 0; font-size: 13px; }
    .stat-row:last-child { border-bottom: none; }
    .btn { display: inline-block; background: #0089C1; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; margin-top: 16px; text-align: center; }
    .footer { padding: 24px; text-align: center; font-size: 11px; color: #64748B; background: #F8FAFC; border-top: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Nigerian Regulatory Intelligence</div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Workspace Configured</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 13px;">Statutory governance for {{.CompanyName}}</p>
    </div>
    <div class="content">
      <p>Dear <strong>{{.RecipientName}}</strong>,</p>
      <p>Congratulations! Your corporate entity workspace for <strong>{{.CompanyName}}</strong> is now active on ComplianceHub.ng.</p>
      
      <p>Our regulatory rules engine has automatically mapped your statutory compliance roadmap across key Nigerian supervisory authorities:</p>
      
      <div class="card">
        <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748B; margin-bottom: 8px;">Workspace Overview</div>
        <div style="font-size: 14px; margin-bottom: 6px;"><strong>Company:</strong> {{.CompanyName}}</div>
        <div style="font-size: 14px; margin-bottom: 6px;"><strong>Initial Health Score:</strong> <span style="color: #0284C7; font-weight: bold;">{{.ComplianceScore}}%</span></div>
        <div style="font-size: 14px; margin-bottom: 6px;"><strong>Statutory Obligations Mapped:</strong> <span style="font-weight: bold;">{{.ObligationsCount}} Active Deadlines</span></div>
        <div style="font-size: 12px; color: #475569; margin-top: 10px;">
          Includes: CAMA 2020 Annual Returns, Nigeria Tax Act 2025/2026 VAT/WHT (TaxPro-MAX), NDPA 2023 RoPA audit schedule, and SCUML compliance.
        </div>
      </div>

      <p style="text-align: center;">
        <a href="{{.DashboardURL}}" class="btn">Enter Corporate Cockpit &rarr;</a>
      </p>

      <p style="font-size: 12px; color: #64748B; margin-top: 24px;">
        Need assistance with your statutory filings? You can engage fractional compliance officers, licensed DPCOs, and chartered tax auditors directly from your dashboard.
      </p>
    </div>
    <div class="footer">
      ComplianceHub Nigeria &bull; Operating in accordance with CAMA 2020, NDPA 2023 & Nigeria Tax Act 2026<br>
      Lagos &bull; Abuja &bull; Port Harcourt
    </div>
  </div>
</body>
</html>
`

	t, err := template.New("welcome").Parse(tmpl)
	if err != nil {
		return err
	}

	var rendered bytes.Buffer
	err = t.Execute(&rendered, map[string]interface{}{
		"RecipientName":    recipientName,
		"CompanyName":      companyName,
		"DashboardURL":     dashboardURL,
		"ObligationsCount": obligationsCount,
		"ComplianceScore":  complianceScore,
	})
	if err != nil {
		return err
	}

	s.SendMailAsync([]string{recipientEmail}, subject, rendered.String())
	return nil
}

// SendPasswordResetEmail dispatches the secure password reset link
func (s *EmailService) SendPasswordResetEmail(recipientEmail, recipientName, resetURL string) error {
	subject := "Reset Your ComplianceHub Nigeria Password"

	tmpl := `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; color: #1E293B; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; }
    .header { background: #1E293B; padding: 28px; text-align: center; color: #ffffff; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .btn { display: inline-block; background: #0089C1; color: #ffffff !important; text-decoration: none; padding: 13px 26px; border-radius: 12px; font-weight: bold; font-size: 13px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 11px; color: #64748B; background: #F8FAFC; border-top: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0; font-size: 20px;">Password Reset Request</h2>
    </div>
    <div class="content">
      <p>Hello <strong>{{.RecipientName}}</strong>,</p>
      <p>We received a request to reset your password for your ComplianceHub.ng account. Click the button below to establish a new password:</p>
      
      <p style="text-align: center;">
        <a href="{{.ResetURL}}" class="btn">Reset Account Password</a>
      </p>

      <p style="font-size: 12px; color: #64748B;">
        For your security, this password reset link will expire in <strong>60 minutes</strong>. If you did not initiate this request, no further action is required and your account remains secure.
      </p>
    </div>
    <div class="footer">
      ComplianceHub Nigeria &bull; Security & Authentication Vault
    </div>
  </div>
</body>
</html>
`

	t, err := template.New("reset").Parse(tmpl)
	if err != nil {
		return err
	}

	var rendered bytes.Buffer
	err = t.Execute(&rendered, map[string]interface{}{
		"RecipientName": recipientName,
		"ResetURL":      resetURL,
	})
	if err != nil {
		return err
	}

	s.SendMailAsync([]string{recipientEmail}, subject, rendered.String())
	return nil
}

// SendTeamInviteEmail dispatches an invitation to join an entity workspace or agency practice
func (s *EmailService) SendTeamInviteEmail(recipientEmail, recipientName, inviterCompany, role, inviteURL string) error {
	subject := fmt.Sprintf("Invitation to join %s on ComplianceHub", inviterCompany)

	tmpl := `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Workspace Invitation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; color: #1E293B; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; }
    .header { background: #1E293B; padding: 28px; text-align: center; color: #ffffff; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .btn { display: inline-block; background: #0089C1; color: #ffffff !important; text-decoration: none; padding: 13px 26px; border-radius: 12px; font-weight: bold; font-size: 13px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 11px; color: #64748B; background: #F8FAFC; border-top: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0; font-size: 20px;">Workspace Access Invitation</h2>
    </div>
    <div class="content">
      <p>Hello <strong>{{.RecipientName}}</strong>,</p>
      <p>You have been invited to join the compliance workspace for <strong>{{.InviterCompany}}</strong> as a <strong>{{.Role}}</strong>.</p>
      
      <p>You will collaborate on statutory filings, evidence vault repositories, and regulatory audits under CAMA 2020, NDPA 2023, and TaxPro-MAX.</p>

      <p style="text-align: center;">
        <a href="{{.InviteURL}}" class="btn">Accept Invitation & Access Workspace</a>
      </p>

      <p style="font-size: 12px; color: #64748B;">
        Default access credentials have been initialized. You may sign in immediately or reset your password upon entry.
      </p>
    </div>
    <div class="footer">
      ComplianceHub Nigeria &bull; Multi-Tenant Workspace Governance
    </div>
  </div>
</body>
</html>
`

	t, err := template.New("invite").Parse(tmpl)
	if err != nil {
		return err
	}

	var rendered bytes.Buffer
	err = t.Execute(&rendered, map[string]interface{}{
		"RecipientName":  recipientName,
		"InviterCompany": inviterCompany,
		"Role":           role,
		"InviteURL":      inviteURL,
	})
	if err != nil {
		return err
	}

	s.SendMailAsync([]string{recipientEmail}, subject, rendered.String())
	return nil
}
