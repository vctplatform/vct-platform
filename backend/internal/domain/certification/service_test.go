package certification_test

import (
	"context"
	"fmt"
	"testing"

	"vct-platform/backend/internal/adapter"
	"vct-platform/backend/internal/domain/certification"
)

var seq int

func idGen() string {
	seq++
	return fmt.Sprintf("cert-%04d", seq)
}

func setup() *certification.Service {
	return certification.NewService(adapter.NewMemCertRepo(), idGen)
}

func TestIssueCertificate(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	cert, err := svc.Issue(ctx, certification.Certificate{
		Type: "coach_license", HolderType: "coach", HolderID: "C-001", HolderName: "Nguyễn Văn A",
	})
	if err != nil {
		t.Fatalf("Issue() error = %v", err)
	}
	if cert.ID == "" {
		t.Error("Issue() ID should not be empty")
	}
	if cert.VerifyCode == "" {
		t.Error("Issue() VerifyCode should not be empty")
	}
	if cert.Status != "active" {
		t.Errorf("Issue() Status = %q, want 'active'", cert.Status)
	}
}

func TestVerifyCertificate(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	cert, _ := svc.Issue(ctx, certification.Certificate{
		Type: "referee_license", HolderType: "referee", HolderID: "R-001", HolderName: "Trần Thị B",
	})

	verified, err := svc.Verify(ctx, cert.VerifyCode)
	if err != nil {
		t.Fatalf("Verify() error = %v", err)
	}
	if verified.HolderName != "Trần Thị B" {
		t.Errorf("Verify() HolderName = %q, want 'Trần Thị B'", verified.HolderName)
	}
}

func TestVerifyInvalidCode(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	_, err := svc.Verify(ctx, "INVALID-CODE")
	if err == nil {
		t.Error("Verify(invalid) should return error")
	}
}

func TestRevokeCertificate(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	cert, _ := svc.Issue(ctx, certification.Certificate{
		Type: "instructor", HolderType: "coach", HolderID: "C-002", HolderName: "Lê Văn C",
	})

	err := svc.Revoke(ctx, cert.ID, "Vi phạm nghiêm trọng")
	if err != nil {
		t.Fatalf("Revoke() error = %v", err)
	}

	// Verify status changed
	revoked, _ := svc.GetCertificate(ctx, cert.ID)
	if revoked.Status != "revoked" {
		t.Errorf("Revoke() Status = %q, want 'revoked'", revoked.Status)
	}
}

func TestRevokeRequiresReason(t *testing.T) {
	svc := setup()
	ctx := context.Background()

	cert, _ := svc.Issue(ctx, certification.Certificate{
		Type: "belt_rank", HolderType: "athlete", HolderID: "A-001", HolderName: "Phạm D",
	})

	err := svc.Revoke(ctx, cert.ID, "")
	if err == nil {
		t.Error("Revoke('') should return error when reason is empty")
	}
}
