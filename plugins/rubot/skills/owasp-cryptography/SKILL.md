---
name: owasp-cryptography
version: 1.0.0
description: |
  Audits cryptographic implementations against OWASP ASVS V11 requirements.
  Covers crypto inventory and documentation, algorithm selection, encryption,
  hashing, random value generation, public key cryptography, and in-use data
  protection. Detects insecure algorithms, weak key sizes, missing authenticated
  encryption, improper random number generation, and post-quantum readiness gaps.

  Trigger on: "cryptography audit", "crypto review", "encryption check",
  "hashing review", "ASVS V11", "random number security", "key management",
  "PQC readiness", "algorithm audit", "cipher review"

  DO NOT trigger for: general code review without crypto context,
  password policy review (use owasp-authentication), TLS/certificate
  configuration (use owasp-secure-communication), secret management
  (use owasp-configuration-security)
agents:
  - debug-master
---

# OWASP ASVS V11 -- Cryptography Verification

## Overview

This skill audits cryptographic implementations against the OWASP Application Security Verification Standard (ASVS) V11 requirements. It covers the full lifecycle of cryptographic operations: inventory and documentation, algorithm selection, encryption, hashing, random value generation, public key cryptography, and protection of data in use.

Weak or improperly implemented cryptography is a critical vulnerability class. Even when "strong" algorithms are used, implementation errors such as missing authenticated encryption, static IVs, or insufficient key lengths can render protections useless.

## When to Use

- Reviewing code that implements or calls cryptographic functions
- Auditing encryption at rest or in transit implementations
- Reviewing password hashing or token generation logic
- Assessing post-quantum cryptography (PQC) readiness
- Evaluating key management and rotation procedures
- Reviewing random number generation for security-sensitive contexts
- Conducting a full ASVS V11 compliance audit

## Verification Requirements

### V11.1 -- Cryptographic Inventory and Documentation

| ID | Requirement | Level |
|---|---|---|
| V11.1.1 | A crypto asset inventory exists listing all keys, certificates, algorithms, and their purposes | L2 |
| V11.1.2 | All cryptographic algorithms in use are documented with version and configuration | L2 |
| V11.1.3 | The inventory identifies algorithms that will need replacement for PQC readiness | L2 |
| V11.1.4 | A process exists for key lifecycle management (generation, rotation, revocation, expiry) | L2 |
| V11.1.5 | Documentation covers fallback strategies for deprecated algorithms | L3 |

**Audit Steps:**
1. Request or locate the cryptographic asset inventory document.
2. Cross-reference the inventory against actual algorithm usage found in code.
3. Verify key lifecycle documentation covers generation, storage, rotation, and destruction.
4. Check for PQC migration planning documentation.

### V11.2 -- Secure Cryptography Implementation

| ID | Requirement | Level |
|---|---|---|
| V11.2.1 | Only approved, well-vetted cryptographic algorithms are used | L1 |
| V11.2.2 | No custom or "home-grown" cryptographic algorithms are implemented | L1 |
| V11.2.3 | Cryptographic implementations use peer-reviewed, maintained libraries | L1 |
| V11.2.4 | Cryptographic operations fail securely (no partial decryption leaks) | L2 |
| V11.2.5 | Cryptographic parameters (IVs, nonces, salts) are generated correctly and never reused | L1 |

**Audit Steps:**
1. Identify all cryptographic library imports and verify they are well-known, maintained libraries.
2. Search for any custom cryptographic code (XOR-based "encryption", custom hash functions).
3. Verify IVs and nonces are generated fresh per operation.
4. Check that cryptographic errors are handled without leaking information.

### V11.3 -- Encryption Algorithms

| ID | Requirement | Level |
|---|---|---|
| V11.3.1 | AES-GCM, AES-CCM, or ChaCha20-Poly1305 are used for symmetric encryption | L1 |
| V11.3.2 | ECB mode is never used | L1 |
| V11.3.3 | Authenticated encryption (AEAD) is used rather than encrypt-then-MAC or encrypt-only | L1 |
| V11.3.4 | AES key sizes are 128-bit or larger (256-bit preferred for PQC readiness) | L1 |
| V11.3.5 | Deprecated algorithms (DES, 3DES, RC4, Blowfish) are not used | L1 |

**Audit Steps:**
1. Search for all symmetric encryption calls and verify algorithm selection.
2. Confirm AEAD modes are used (GCM, CCM, Poly1305).
3. Check for ECB mode usage or encrypt-without-authenticate patterns.
4. Verify key sizes meet minimum requirements.

### V11.4 -- Hashing and Hash-based Functions

| ID | Requirement | Level |
|---|---|---|
| V11.4.1 | SHA-256 or stronger is used for general-purpose hashing | L1 |
| V11.4.2 | MD5 and SHA-1 are not used for any security purpose | L1 |
| V11.4.3 | Password hashing uses Argon2id, bcrypt, or scrypt with appropriate parameters | L1 |
| V11.4.4 | HMAC is used for message authentication with appropriate key sizes | L1 |
| V11.4.5 | Password hash work factors are configured to take at least 250ms | L2 |

**Audit Steps:**
1. Search for all hash function usage and verify algorithm selection.
2. Confirm passwords are hashed with Argon2id, bcrypt, or scrypt.
3. Verify HMAC usage patterns and key management.
4. Check password hashing work factor configuration.

### V11.5 -- Random Values

| ID | Requirement | Level |
|---|---|---|
| V11.5.1 | CSPRNG is used for all security-sensitive random values | L1 |
| V11.5.2 | Math.random() or equivalent weak PRNGs are never used for security contexts | L1 |
| V11.5.3 | Random values have sufficient entropy for their purpose (e.g., 128-bit+ for tokens) | L1 |
| V11.5.4 | Entropy sources are properly seeded and verified | L2 |
| V11.5.5 | UUIDs used for security purposes are v4 (random) or v7, not v1 (time-based) | L1 |

**Audit Steps:**
1. Search for all random value generation calls.
2. Verify CSPRNG usage (crypto.randomBytes, crypto.getRandomValues, secrets module).
3. Flag any Math.random(), rand(), or similar weak PRNG usage in security contexts.
4. Check token/session ID entropy (minimum 128 bits).

### V11.6 -- Public Key Cryptography

| ID | Requirement | Level |
|---|---|---|
| V11.6.1 | RSA keys are 2048 bits or larger (3072+ recommended) | L1 |
| V11.6.2 | ECDSA uses approved curves (P-256, P-384, P-521) | L1 |
| V11.6.3 | EdDSA (Ed25519, Ed448) is preferred for new implementations | L2 |
| V11.6.4 | Diffie-Hellman parameters are 2048 bits or larger | L1 |
| V11.6.5 | Private keys are stored securely and never exposed in logs or error messages | L1 |
| V11.6.6 | Key exchange uses ephemeral keys (ECDHE, DHE) for forward secrecy | L1 |

**Audit Steps:**
1. Check RSA key sizes in certificate generation and key pair creation.
2. Verify elliptic curve selections.
3. Confirm private key storage security.
4. Check for forward secrecy in key exchange implementations.

### V11.7 -- In-Use Data Cryptography

| ID | Requirement | Level |
|---|---|---|
| V11.7.1 | Sensitive data is encrypted promptly after use and not held in cleartext longer than necessary | L2 |
| V11.7.2 | Memory containing sensitive cryptographic material is zeroized after use | L2 |
| V11.7.3 | Data in transit between components uses encryption (not just perimeter TLS) | L2 |
| V11.7.4 | Sensitive data does not leak through swap files, core dumps, or memory snapshots | L3 |

**Audit Steps:**
1. Review how long decrypted sensitive data persists in memory.
2. Check for explicit memory clearing after cryptographic operations.
3. Verify inter-component communication encryption.
4. Check for secure memory allocation patterns where available.

## Code Review Patterns

### Detecting Weak or Banned Algorithms

```bash
# Search for MD5 usage
grep -rn "MD5\|md5\|createHash.*md5\|hashlib\.md5\|MessageDigest.*MD5" --include="*.{js,ts,py,java,go,rb,cs}"

# Search for SHA-1 usage
grep -rn "SHA1\|sha1\|createHash.*sha1\|hashlib\.sha1\|MessageDigest.*SHA-1" --include="*.{js,ts,py,java,go,rb,cs}"

# Search for DES/3DES/RC4
grep -rn "DES\|3DES\|TripleDES\|RC4\|ARCFOUR\|Blowfish" --include="*.{js,ts,py,java,go,rb,cs}"

# Search for ECB mode
grep -rn "ECB\|\/ECB\/\|mode.*ecb\|AES\/ECB" --include="*.{js,ts,py,java,go,rb,cs}"
```

### Detecting Insecure Random Number Generation

```bash
# JavaScript/TypeScript weak random
grep -rn "Math\.random\(\)" --include="*.{js,ts,jsx,tsx}"

# Python weak random
grep -rn "import random\b\|from random import\|random\.random\|random\.randint\|random\.choice" --include="*.py"

# Java weak random
grep -rn "java\.util\.Random\|new Random()" --include="*.java"

# UUID v1 usage (time-based, predictable)
grep -rn "uuid\.v1\|uuid1\|UUID\.randomUUID\|uuidv1" --include="*.{js,ts,py,java}"
```

### Detecting Custom Crypto Implementations

```bash
# XOR-based "encryption"
grep -rn "xor.*encrypt\|encrypt.*xor\|\^ 0x\|charCodeAt.*\^" --include="*.{js,ts,py,java}"

# Base64 used as "encryption"
grep -rn "btoa\|atob\|base64.*encod.*secret\|base64.*encod.*password" --include="*.{js,ts,jsx,tsx}"

# Hardcoded IVs or keys
grep -rn "iv.*=.*['\"].\{16,\}['\"]\|key.*=.*['\"].\{16,\}['\"]" --include="*.{js,ts,py,java}"
```

### Detecting Password Hashing Issues

```bash
# Check for proper password hashing libraries
grep -rn "argon2\|bcrypt\|scrypt\|pbkdf2" --include="*.{js,ts,py,java,go,rb}"

# Detect plain hash used for passwords
grep -rn "sha256.*password\|sha512.*password\|createHash.*password\|hashlib.*password" --include="*.{js,ts,py,java}"
```

### Detecting Key Management Issues

```bash
# Hardcoded keys/secrets
grep -rn "-----BEGIN.*PRIVATE KEY-----\|AKIA[0-9A-Z]\{16\}\|sk_live_\|rk_live_" --include="*.{js,ts,py,java,go,rb,cs}"

# Keys in source code
grep -rn "private_key\s*=\s*['\"].\+['\"]\|secret_key\s*=\s*['\"].\+['\"]" --include="*.{js,ts,py,java,go,rb}"
```

## Remediation Guidance

### Use AEAD Encryption (Node.js Example)

```javascript
// WRONG: AES-CBC without authentication
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

// CORRECT: AES-GCM (authenticated encryption)
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
cipher.setAAD(additionalData);
const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const authTag = cipher.getAuthTag();
// Store: iv + authTag + encrypted
```

### Use CSPRNG for Security-Sensitive Values

```javascript
// WRONG
const token = Math.random().toString(36).substring(2);

// CORRECT
const token = crypto.randomBytes(32).toString('hex');
// Or in browser:
const token = crypto.getRandomValues(new Uint8Array(32));
```

```python
# WRONG
import random
token = ''.join(random.choices(string.ascii_letters, k=32))

# CORRECT
import secrets
token = secrets.token_hex(32)
```

### Password Hashing with Argon2id

```javascript
// Using argon2 package
const argon2 = require('argon2');

// Hashing
const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,  // 64 MB
  timeCost: 3,
  parallelism: 4
});

// Verification
const valid = await argon2.verify(hash, password);
```

```python
# Using argon2-cffi
from argon2 import PasswordHasher
ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
hash = ph.hash(password)
ph.verify(hash, password)
```

### RSA Key Generation with Proper Size

```javascript
const { generateKeyPairSync } = require('crypto');

// WRONG: 1024-bit RSA
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 1024
});

// CORRECT: 3072-bit RSA (PQC-ready: 4096)
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 3072,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
```

### Memory Clearing After Crypto Operations

```javascript
// Clear sensitive buffers after use
function secureClear(buffer) {
  if (Buffer.isBuffer(buffer)) {
    buffer.fill(0);
  }
}

try {
  const decrypted = decrypt(ciphertext, key);
  processData(decrypted);
} finally {
  secureClear(decrypted);
  secureClear(key);
}
```

## ASVS Level Reference

| Section | L1 | L2 | L3 |
|---|---|---|---|
| V11.1 Crypto Inventory | -- | Required | Required |
| V11.2 Secure Implementation | Required | Required | Required |
| V11.3 Encryption Algorithms | Required | Required | Required |
| V11.4 Hashing Functions | Required | Required | Required |
| V11.5 Random Values | Required | Required | Required |
| V11.6 Public Key Crypto | Required | Required | Required |
| V11.7 In-Use Data Crypto | -- | Required | Required |

## References

- [OWASP ASVS V11 -- Cryptography](https://owasp.org/www-project-application-security-verification-standard/)
- [NIST SP 800-57 -- Key Management Recommendations](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [NIST Post-Quantum Cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [OWASP Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
