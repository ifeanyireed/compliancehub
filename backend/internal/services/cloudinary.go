package services

import (
	"context"
	"crypto/sha1"
	"fmt"
	"io"
	"net/url"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type CloudinaryService struct {
	CloudName string
	APIKey    string
	APISecret string
	cld       *cloudinary.Cloudinary
}

var CldService *CloudinaryService

func InitCloudinary() (*CloudinaryService, error) {
	cldURL := os.Getenv("CLOUDINARY_URL")
	if cldURL == "" {
		return nil, fmt.Errorf("CLOUDINARY_URL environment variable is required")
	}

	u, err := url.Parse(cldURL)
	if err != nil {
		return nil, fmt.Errorf("invalid CLOUDINARY_URL: %w", err)
	}

	apiKey := u.User.Username()
	apiSecret, _ := u.User.Password()
	cloudName := u.Host

	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to init cloudinary instance: %w", err)
	}

	CldService = &CloudinaryService{
		CloudName: cloudName,
		APIKey:    apiKey,
		APISecret: apiSecret,
		cld:       cld,
	}

	return CldService, nil
}

// GenerateUploadSignature creates a SHA-1 signature for direct client-to-Cloudinary uploads
func (s *CloudinaryService) GenerateUploadSignature(folder string, publicID string) (string, int64, string, string) {
	timestamp := time.Now().Unix()

	params := map[string]string{
		"timestamp": fmt.Sprintf("%d", timestamp),
	}

	if folder != "" {
		params["folder"] = folder
	}
	if publicID != "" {
		params["public_id"] = publicID
	}

	// Sort keys alphabetically as required by Cloudinary signing specification
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var paramParts []string
	for _, k := range keys {
		paramParts = append(paramParts, fmt.Sprintf("%s=%s", k, params[k]))
	}

	toSign := strings.Join(paramParts, "&") + s.APISecret
	h := sha1.New()
	h.Write([]byte(toSign))
	signature := fmt.Sprintf("%x", h.Sum(nil))

	return signature, timestamp, s.APIKey, s.CloudName
}

// UploadDirect streams file data to Cloudinary server-side
func (s *CloudinaryService) UploadDirect(ctx context.Context, file io.Reader, folder string, publicID string) (string, string, int64, string, error) {
	if s.cld == nil {
		return "", "", 0, "", fmt.Errorf("cloudinary client not initialized")
	}

	resp, err := s.cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:   folder,
		PublicID: publicID,
	})
	if err != nil {
		return "", "", 0, "", fmt.Errorf("cloudinary upload failed: %w", err)
	}

	return resp.SecureURL, resp.PublicID, int64(resp.Bytes), resp.Format, nil
}
