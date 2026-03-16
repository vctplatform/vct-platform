package email

import (
	"fmt"
	"log"

	"github.com/resend/resend-go/v3"
)

// Service sends transactional emails via Resend.
type Service struct {
	client *resend.Client
	from   string
}

// NewService creates a Resend email service.
// If apiKey is empty the service will log emails instead of sending.
func NewService(apiKey, fromAddress string) *Service {
	if fromAddress == "" {
		fromAddress = "onboarding@resend.dev"
	}
	var client *resend.Client
	if apiKey != "" {
		client = resend.NewClient(apiKey)
	}
	return &Service{client: client, from: fromAddress}
}

// SendOTP sends a 6-digit OTP code to the given email address.
func (s *Service) SendOTP(to, code, displayName string) error {
	subject := fmt.Sprintf("[VCT Platform] Mã xác thực: %s", code)
	html := fmt.Sprintf(`
		<div style="font-family:'Inter',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a101e;border-radius:16px;color:#e2e8f0">
			<div style="text-align:center;margin-bottom:24px">
				<h1 style="margin:0;font-size:20px;font-weight:800;color:#10b981">VCT Platform</h1>
				<p style="margin:4px 0 0;font-size:12px;color:#94a3b8">Hệ sinh thái Võ cổ truyền Việt Nam</p>
			</div>
			<div style="text-align:center;padding:20px;background:rgba(16,185,129,0.08);border-radius:12px;border:1px solid rgba(16,185,129,0.2)">
				<p style="margin:0 0 8px;font-size:14px;color:#94a3b8">Xin chào <strong style="color:#e2e8f0">%s</strong>,</p>
				<p style="margin:0 0 16px;font-size:13px;color:#94a3b8">Mã xác thực tài khoản của bạn:</p>
				<div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#10b981;padding:12px 0">%s</div>
				<p style="margin:12px 0 0;font-size:11px;color:#64748b">Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai.</p>
			</div>
			<p style="margin:20px 0 0;font-size:11px;color:#475569;text-align:center">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
		</div>
	`, displayName, code)

	if s.client == nil {
		log.Printf("[email] (dry-run) OTP %s → %s", code, to)
		return nil
	}

	_, err := s.client.Emails.Send(&resend.SendEmailRequest{
		From:    s.from,
		To:      []string{to},
		Subject: subject,
		Html:    html,
	})
	if err != nil {
		log.Printf("[email] send failed to %s: %v", to, err)
		return fmt.Errorf("gửi email thất bại: %w", err)
	}
	log.Printf("[email] OTP sent to %s", to)
	return nil
}
