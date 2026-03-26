# VCT Platform File Storage & Media Architecture

This document governs how the VCT Platform handles binaries, images, PDFs, and rich media assets. To maintain a fast backend and preserve database integrity, strict upload offloading rules apply.

## 1. Zero Binary Backend (The Upload Bottleneck)
- **Rule**: The Go backend HTTP server MUST NOT accept large `multipart/form-data` file uploads directly if the file size exceeds 5MB. 
- **Base64 Ban**: Submitting Base64-encoded files embedded inside JSON payloads is strictly prohibited. It bloats JSON deserialization memory and stresses the Garbage Collector.

## 2. Presigned URLs Workflow
- **Rule**: All file uploads MUST utilize the S3/MinIO Presigned URL pattern:
  1. Client sends metadata (`filename`, `mimetype`) to Backend.
  2. Backend validates permissions and returns a short-lived `PUT` Presigned URL.
  3. Client uploads directly to the Object Store (MinIO/S3), bypassing the Go Backend.
  4. Client notifies Backend that the upload is complete.

## 3. Media Optimization & Edge Compression
- **Format Standard**: All raw `JPEG/PNG` avatar or gallery uploads MUST be asynchronously processed into `WebP` or `AVIF` formats for optimal web/mobile delivery.
- **Image Resizing**: The backend MUST NOT serve multi-megabyte raw images to mobile devices. Images must be stored with multiple resolution variants (e.g., `sm`, `md`, `lg`) or transformed dynamically on the edge (e.g., Cloudflare Image Resizing).

## 4. Privacy and Access Control
- **Public Assets**: Club Logos, Athlete Avatars, and Banner images are stored in a `public` bucket and served directly via CDN with cache-control headers.
- **Private Assets**: Identity Cards (CCCD), Medical Certificates, and Financial Invoices MUST be stored in a `private` bucket. They can only be accessed via secure `GET` Presigned URLs that expire quickly (e.g., 15 minutes).
