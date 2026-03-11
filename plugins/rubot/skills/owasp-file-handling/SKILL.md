---
name: owasp-file-handling
version: 1.0.0
description: |
  Audits application code for OWASP ASVS V5 compliance covering file upload validation,
  file storage security, file download protection, and file handling documentation. Provides
  verification checklists, code review patterns, and remediation guidance for file type
  validation, magic byte checking, size limits, antivirus scanning, path traversal prevention,
  and secure file serving.

  Trigger on: "file upload security", "file handling audit", "ASVS V5", "file type validation",
  "magic bytes", "file size limit", "antivirus scanning", "path traversal", "file download security",
  "Content-Disposition", "upload restriction", "file storage security", "file execution prevention",
  "web shell prevention", "zip bomb", "file upload vulnerability"

  DO NOT trigger for: input validation logic (use owasp-validation-logic),
  encoding and sanitization (use owasp-encoding-sanitization), API structure validation
  (use owasp-api-security), general authentication (use owasp-authentication),
  data protection at rest (use owasp-data-protection)
agents:
  - debug-master
---

# OWASP ASVS V5 -- File Handling Security Audit

## Overview

ASVS V5 addresses the security of file upload, storage, and download operations. File
handling vulnerabilities can lead to remote code execution (web shells), server compromise,
denial of service (zip bombs, storage exhaustion), data exfiltration via path traversal,
and cross-site scripting via malicious file content. This skill guides a comprehensive
audit of file handling code to verify compliance with each V5 requirement.

## When to Use

- Auditing file upload endpoints for type validation, size limits, and content inspection
- Reviewing file storage architecture for execution prevention and isolation
- Checking file download mechanisms for path traversal and injection
- Evaluating antivirus scanning integration for user-uploaded content
- Assessing protection against web shell uploads and zip bomb attacks
- Performing a targeted ASVS V5 compliance check

## Verification Requirements

### V5.1 -- File Handling Documentation

| ID | Requirement | Level |
|----|-------------|-------|
| V5.1.1 | Expected file types, maximum sizes, and allowed extensions are documented for each upload endpoint | L2 |
| V5.1.2 | File storage locations and access permissions are documented | L2 |
| V5.1.3 | File naming conventions and sanitization rules are documented | L2 |

**Audit steps:**

1. Identify all file upload endpoints in the application.
2. Check for documentation of allowed file types, extensions, and size limits per endpoint.
3. Verify file storage architecture is documented (storage location, permissions, access method).
4. Review naming conventions for stored files (randomized names vs. original names).

### V5.2 -- File Upload and Content Validation

| ID | Requirement | Level |
|----|-------------|-------|
| V5.2.1 | File extension is validated against an allowlist of permitted extensions | L1 |
| V5.2.2 | File content is validated using magic bytes / file signatures, not just extension | L1 |
| V5.2.3 | Maximum file size is enforced before the full file is read into memory | L1 |
| V5.2.4 | Total upload quota per user or session is enforced | L2 |
| V5.2.5 | Image files are re-processed (re-encoded) to strip embedded payloads | L2 |
| V5.2.6 | Archive files (ZIP, TAR) are inspected for zip bombs (compression ratio limits) | L2 |
| V5.2.7 | Antivirus / malware scanning is performed on uploaded files | L2 |
| V5.2.8 | Double extensions (e.g., file.php.jpg) and null bytes in filenames are rejected | L1 |
| V5.2.9 | SVG files are sanitized or rejected due to embedded script risk | L1 |
| V5.2.10 | MIME type sent by client is not trusted; server-side detection is used | L1 |

**Audit steps:**

1. Test uploading files with mismatched extensions (e.g., .jpg file containing PHP code).
2. Upload files with double extensions (shell.php.jpg, test.html.png).
3. Test with null byte filenames (file.php%00.jpg).
4. Upload oversized files and verify the server rejects them early (streaming check, not post-upload).
5. Upload a zip bomb and verify decompression limits are enforced.
6. Upload an SVG with embedded JavaScript and verify it is sanitized or rejected.
7. Check if uploaded files are scanned for malware before being accessible.
8. Test image re-encoding by uploading an image with EXIF-embedded payloads.

### V5.3 -- File Storage

| ID | Requirement | Level |
|----|-------------|-------|
| V5.3.1 | Uploaded files are stored outside the web root and cannot be accessed directly via URL | L1 |
| V5.3.2 | Uploaded files are stored with randomized names (not user-supplied names) | L1 |
| V5.3.3 | File execution is disabled in the upload directory (no script handlers, no execute permission) | L1 |
| V5.3.4 | File metadata (original name, size, type) is stored in the database, not derived from the file system | L1 |
| V5.3.5 | Dangerous file types (HTML, SVG, XML) are served with Content-Disposition: attachment | L1 |
| V5.3.6 | Cloud storage (S3, GCS) uses signed URLs with expiration for file access | L2 |
| V5.3.7 | Temporary files are cleaned up after processing | L2 |
| V5.3.8 | File permissions are set to minimum required (read-only for served files) | L2 |

**Audit steps:**

1. Verify upload directory is not under the web root (not in /public, /static, /www).
2. Check that stored filenames are UUIDs or hashes, not user-provided names.
3. Inspect web server configuration for script execution in upload directories.
4. Verify file metadata is stored in the database and not reconstructed from filenames.
5. Check Content-Disposition headers when serving uploaded files.
6. For cloud storage, verify signed URLs have short expiration times.
7. Check for temporary file cleanup in upload processing code.

### V5.4 -- File Download and Serving

| ID | Requirement | Level |
|----|-------------|-------|
| V5.4.1 | File paths for download are constructed server-side, not from user input | L1 |
| V5.4.2 | Path traversal is prevented (../, %2e%2e%2f, encoded sequences are blocked) | L1 |
| V5.4.3 | Content-Disposition header is set with sanitized filenames | L1 |
| V5.4.4 | Content-Type is set based on server-side detection, not user input or stored MIME type | L1 |
| V5.4.5 | Files are served from a dedicated file-serving domain or CDN to isolate from the main application | L2 |
| V5.4.6 | Zip/archive downloads are generated safely, preventing zip slip in generated archives | L2 |
| V5.4.7 | Range requests are handled safely to prevent information disclosure | L2 |
| V5.4.8 | Filename injection in Content-Disposition is prevented (sanitize special characters) | L1 |

**Audit steps:**

1. Test download endpoints with path traversal sequences: `../`, `..%2f`, `%2e%2e/`, `....//`.
2. Test with absolute paths: `/etc/passwd`, `C:\Windows\win.ini`.
3. Check Content-Disposition header for filename injection (newlines, semicolons in filename).
4. Verify file path construction uses an ID-to-path lookup, not direct path concatenation.
5. Test Content-Type by downloading files and verifying the header matches actual content.
6. Check for dedicated file-serving domain to isolate from the main application origin.

## Code Review Patterns

### File Upload Endpoints

```bash
# File upload handling
grep -rn "multer\|formidable\|busboy\|multipart\|upload\|file.*upload" --include="*.ts" --include="*.js"
grep -rn "FileField\|FileUpload\|UploadFile\|request\.files" --include="*.py"
grep -rn "MultipartFile\|@RequestParam.*file\|CommonsMultipartFile" --include="*.java"

# File extension validation
grep -rn "\.extension\|\.ext\|mimetype\|content-type\|file\.type\|originalname" --include="*.ts" --include="*.js"

# Missing file type checks
grep -rn "upload\|multer" --include="*.ts" --include="*.js" | grep -v "fileFilter\|limits\|accept\|allowed"
```

### Magic Byte / Content Validation

```bash
# Magic byte checking libraries
grep -rn "file-type\|magic-bytes\|python-magic\|filetype\|libmagic" --include="*.ts" --include="*.js" --include="*.py" --include="*.json"

# Image re-encoding
grep -rn "sharp\|jimp\|Pillow\|PIL\|ImageMagick\|gm(" --include="*.ts" --include="*.js" --include="*.py"
```

### File Storage Patterns

```bash
# File storage paths (check if under web root)
grep -rn "dest.*public\|destination.*static\|upload.*www\|storage.*public" --include="*.ts" --include="*.js" --include="*.py"

# User-supplied filenames used in storage
grep -rn "originalname\|original_filename\|filename.*req\|file\.name" --include="*.ts" --include="*.js" --include="*.py"

# Missing randomization
grep -rn "dest\|destination\|storage" --include="*.ts" --include="*.js" | grep -v "uuid\|random\|crypto\|hash"

# Cloud storage signed URLs
grep -rn "getSignedUrl\|generate_signed_url\|presigned\|createPresignedPost" --include="*.ts" --include="*.js" --include="*.py"
```

### Path Traversal Vulnerabilities

```bash
# Direct path construction from user input
grep -rn "path\.join.*req\.\|path\.resolve.*req\.\|os\.path\.join.*request" --include="*.ts" --include="*.js" --include="*.py"

# File reading from user-supplied paths
grep -rn "readFile.*req\.\|createReadStream.*req\.\|open.*request\." --include="*.ts" --include="*.js" --include="*.py"

# Path traversal prevention (positive pattern -- should exist)
grep -rn "path\.normalize\|realpath\|startsWith.*upload\|abspath" --include="*.ts" --include="*.js" --include="*.py"

# sendFile with user input
grep -rn "sendFile\|res\.download\|send_file\|FileResponse" --include="*.ts" --include="*.js" --include="*.py"
```

### Content-Disposition and Serving

```bash
# Content-Disposition header setting
grep -rn "Content-Disposition\|content-disposition\|attachment\|inline" --include="*.ts" --include="*.js" --include="*.py"

# Filename in headers without sanitization
grep -rn "filename=.*req\.\|filename=.*original\|filename=.*name" --include="*.ts" --include="*.js"
```

### Zip/Archive Handling

```bash
# Archive extraction (zip slip risk)
grep -rn "unzip\|extract\|decompress\|ZipFile\|tarfile\|AdmZip\|yauzl\|archiver" --include="*.ts" --include="*.js" --include="*.py"

# Compression ratio checks (zip bomb prevention)
grep -rn "compressionRatio\|uncompressedSize\|ratio\|bomb" --include="*.ts" --include="*.js" --include="*.py"
```

## Remediation Guidance

### Secure File Upload (Node.js with Multer)

```typescript
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';

// Store outside web root with randomized names
const storage = multer.diskStorage({
  destination: '/var/app/uploads/', // NOT in public/static
  filename: (req, file, cb) => {
    // Randomized filename -- never use original
    const randomName = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  },
});

// Extension and size allowlist
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 5,                   // Max 5 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('File type not allowed'));
    }
    cb(null, true);
  },
});

// After upload: validate magic bytes
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  // Validate file content via magic bytes
  const fs = await import('fs/promises');
  const buffer = await fs.readFile(req.file.path);
  const type = await fileTypeFromBuffer(buffer);

  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'application/pdf',
  ];

  if (!type || !allowedMimeTypes.includes(type.mime)) {
    await fs.unlink(req.file.path); // Delete invalid file
    return res.status(400).json({ error: 'Invalid file content' });
  }

  // Store metadata in database
  await db.files.create({
    id: crypto.randomUUID(),
    originalName: file.originalname,
    storedName: req.file.filename,
    mimeType: type.mime,
    size: req.file.size,
    uploadedBy: req.user.id,
  });

  res.json({ message: 'File uploaded successfully' });
});
```

### Image Re-encoding to Strip Payloads

```typescript
import sharp from 'sharp';

async function sanitizeImage(inputPath: string, outputPath: string): Promise<void> {
  // Re-encode image, stripping EXIF data and any embedded payloads
  await sharp(inputPath)
    .rotate()           // Apply EXIF rotation before stripping
    .withMetadata({})   // Strip all metadata
    .toFile(outputPath);

  // Delete the original unsanitized file
  await fs.unlink(inputPath);
}
```

### SVG Sanitization

```typescript
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

function sanitizeSVG(svgContent: string): string {
  const window = new JSDOM('').window;
  const purify = DOMPurify(window);

  // Remove all scripts and event handlers from SVG
  return purify.sanitize(svgContent, {
    USE_PROFILES: { svg: true },
    ADD_TAGS: ['svg', 'path', 'circle', 'rect', 'line', 'polygon', 'text'],
    FORBID_TAGS: ['script', 'foreignObject', 'iframe'],
    FORBID_ATTR: ['onload', 'onclick', 'onerror', 'onmouseover', 'xlink:href'],
  });
}
```

### Path Traversal Prevention

```typescript
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = '/var/app/uploads';

// VULNERABLE -- direct path from user input
app.get('/download', async (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.query.file); // path traversal!
  res.sendFile(filePath);
});

// SAFE -- lookup by ID, validate resolved path
app.get('/download/:fileId', async (req, res) => {
  // Look up file by ID in database
  const fileRecord = await db.files.findById(req.params.fileId);
  if (!fileRecord) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Verify authorization
  if (fileRecord.uploadedBy !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Construct path from trusted database value
  const filePath = path.join(UPLOAD_DIR, fileRecord.storedName);

  // Double-check: resolved path must be within UPLOAD_DIR
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(UPLOAD_DIR))) {
    return res.status(400).json({ error: 'Invalid file path' });
  }

  // Safe Content-Disposition with sanitized filename
  const safeName = fileRecord.originalName.replace(/[^\w\-. ]/g, '_');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  res.setHeader('Content-Type', fileRecord.mimeType);
  res.sendFile(resolvedPath);
});
```

### Zip Bomb Prevention

```typescript
import yauzl from 'yauzl';

const MAX_UNCOMPRESSED_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_COMPRESSION_RATIO = 10; // 10:1 ratio limit
const MAX_FILES = 1000;

async function safeExtract(zipPath: string, destDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);

      let totalSize = 0;
      let fileCount = 0;
      const compressedSize = fs.statSync(zipPath).size;

      zipfile.readEntry();
      zipfile.on('entry', (entry) => {
        fileCount++;
        if (fileCount > MAX_FILES) {
          zipfile.close();
          return reject(new Error('Too many files in archive'));
        }

        totalSize += entry.uncompressedSize;
        if (totalSize > MAX_UNCOMPRESSED_SIZE) {
          zipfile.close();
          return reject(new Error('Archive too large when extracted'));
        }

        if (totalSize / compressedSize > MAX_COMPRESSION_RATIO) {
          zipfile.close();
          return reject(new Error('Suspicious compression ratio (possible zip bomb)'));
        }

        // Zip slip prevention: verify path stays within destDir
        const fullPath = path.join(destDir, entry.fileName);
        if (!fullPath.startsWith(path.resolve(destDir))) {
          zipfile.close();
          return reject(new Error('Path traversal detected in archive'));
        }

        zipfile.readEntry();
      });

      zipfile.on('end', resolve);
    });
  });
}
```

### Cloud Storage with Signed URLs

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'us-east-1' });

// Generate upload presigned URL (short expiry)
async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: 'my-uploads-bucket',
    Key: `uploads/${key}`,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
}

// Generate download presigned URL (short expiry)
async function getDownloadUrl(key: string, originalName: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: 'my-uploads-bucket',
    Key: `uploads/${key}`,
    ResponseContentDisposition: `attachment; filename="${originalName.replace(/"/g, '_')}"`,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
}
```

### Nginx -- Disable Execution in Upload Directory

```nginx
# Prevent script execution in upload directory
location /uploads/ {
    # Serve files as static content only
    location ~ \.(php|py|pl|cgi|sh|asp|aspx|jsp)$ {
        deny all;
    }

    # Force download for dangerous types
    location ~ \.(html|htm|svg|xml)$ {
        add_header Content-Disposition "attachment";
        add_header X-Content-Type-Options "nosniff";
    }

    # Disable execution
    location ~ \.php$ {
        return 403;
    }
}
```

## ASVS Level Reference

| Section | L1 (Minimum) | L2 (Standard) | L3 (Advanced) |
|---------|-------------|---------------|---------------|
| V5.1 Documentation | -- | Document file types, sizes, storage, naming conventions | Full file handling threat model |
| V5.2 Upload Validation | Extension allowlist, magic bytes, size limits, no double extensions, SVG sanitization | Quota enforcement, image re-encoding, zip bomb prevention, AV scanning | Content disarm and reconstruction |
| V5.3 File Storage | Outside web root, random names, no execution, metadata in DB | Signed URLs, temp file cleanup, least-privilege permissions | Isolated file storage infrastructure |
| V5.4 File Download | No path traversal, safe Content-Disposition, server-side Content-Type | Dedicated file domain, safe archive generation | Full file serving penetration test |

## References

- [OWASP ASVS v5.0 -- V5: File Handling](https://github.com/OWASP/ASVS/blob/v5.0/5.0/en/0x16-V5-Files.md)
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [Snyk Zip Slip Vulnerability](https://snyk.io/research/zip-slip-vulnerability)
- [file-type npm package](https://www.npmjs.com/package/file-type)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [DOMPurify SVG Sanitization](https://github.com/cure53/DOMPurify)
- [Multer Documentation](https://www.npmjs.com/package/multer)
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
