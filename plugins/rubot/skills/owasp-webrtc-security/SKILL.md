---
name: owasp-webrtc-security
version: 1.1.0
description: |
  Audits WebRTC implementations against OWASP ASVS V17 requirements.
  MUST activate for: WebRTC audit, TURN server review, WebRTC security, ASVS V17, DTLS/SRTP check, signaling server security, media server review, peer connection security, ICE security, STUN/TURN audit.
  Also activate when: user asks to review video call security, check coturn configuration, audit real-time communication encryption, verify TURN credential rotation, review SDP validation, check for IP address leakage in peer connections, assess WebSocket signaling security, review SFU/MCU media forwarding, check ICE candidate filtering for privacy.
  Do NOT activate for: general TLS/HTTPS configuration (use owasp-secure-communication), API security (use owasp-api-security), general application authentication (use owasp-authentication).
  Covers: TURN server security (address filtering, resource exhaustion prevention, authentication, short-lived HMAC credentials, relay port range, TURNS over TLS, loopback/link-local blocking, rate limiting, bandwidth limits), media security (DTLS 1.2+ key exchange, SRTP encryption enforcement, flood attack protection, malformed RTP/RTCP handling, buffer overflow prevention, DTLS fingerprint verification, encryption downgrade prevention, RTP header extension validation, SFU/MCU stream validation), signaling server security (WSS encrypted transport, SDP validation, ICE candidate validation, load resilience, session authentication, SDP injection prevention, ICE candidate IP filtering, session ownership validation, re-INVITE attack prevention, message size limits, WebSocket connection limits).
agents:
  - debug-master
---

# OWASP ASVS V17 -- WebRTC Security Verification

## Overview

This skill audits WebRTC implementations against OWASP ASVS V17 requirements. WebRTC enables real-time peer-to-peer communication for audio, video, and data channels. Its security requires attention at three layers: TURN servers that relay media when direct connections fail, media transport that carries encrypted audio/video streams, and signaling servers that orchestrate session establishment.

WebRTC security is distinct from general web security because it involves UDP-based protocols, peer-to-peer connections, NAT traversal, and real-time media streams. Vulnerabilities in WebRTC can lead to IP address leakage, denial of service, unauthorized media interception, and server resource exhaustion.

## When to Use

- Reviewing WebRTC implementation security
- Auditing TURN/STUN server configuration
- Checking DTLS/SRTP encryption for media streams
- Evaluating signaling server security and availability
- Reviewing ICE candidate handling and IP privacy
- Assessing media server (SFU/MCU) security
- Testing WebRTC flood and abuse protections
- Conducting a full ASVS V17 compliance audit

## Verification Requirements

### V17.1 -- TURN Server

| ID | Requirement | Level |
|---|---|---|
| V17.1.1 | TURN server implements address filtering to prevent relay to internal/private networks | L1 |
| V17.1.2 | TURN server prevents resource exhaustion through connection limits per user | L1 |
| V17.1.3 | TURN server requires authentication for all relay requests | L1 |
| V17.1.4 | TURN credentials are short-lived and rotated (time-limited HMAC-based credentials) | L2 |
| V17.1.5 | TURN server restricts relay ports to a defined range | L2 |
| V17.1.6 | TURN server monitors and logs relay usage for abuse detection | L2 |
| V17.1.7 | TURN over TLS (TURNS) is supported and preferred over plain TURN | L1 |
| V17.1.8 | TURN server does not relay traffic to loopback or link-local addresses | L1 |
| V17.1.9 | Rate limiting is applied to TURN allocation requests | L2 |
| V17.1.10 | Bandwidth limits are configured per allocation to prevent abuse | L2 |

**Audit Steps:**
1. Review TURN server configuration for address filtering rules.
2. Verify authentication is required (no anonymous relay).
3. Check credential generation mechanism (time-limited HMAC preferred).
4. Test connection limits and rate limiting configuration.
5. Verify TURNS (TLS) is available and default.
6. Check denied address ranges (private networks, loopback).
7. Review relay port range configuration.

### V17.2 -- Media

| ID | Requirement | Level |
|---|---|---|
| V17.2.1 | DTLS 1.2+ is used for key exchange in all media connections | L1 |
| V17.2.2 | SRTP is used for all media encryption (not RTP) | L1 |
| V17.2.3 | Flood attack protection limits media packet rates per connection | L1 |
| V17.2.4 | Malformed RTP/RTCP packets are detected and dropped without crashing | L1 |
| V17.2.5 | Rate limiting is applied to media streams to prevent bandwidth abuse | L2 |
| V17.2.6 | Buffer overflow prevention is in place for media packet processing | L1 |
| V17.2.7 | DTLS certificate fingerprints are verified through the signaling channel | L1 |
| V17.2.8 | Media stream encryption cannot be downgraded or disabled | L1 |
| V17.2.9 | RTP header extensions are validated and restricted to known types | L2 |
| V17.2.10 | SFU/MCU servers validate and sanitize forwarded media streams | L2 |

**Audit Steps:**
1. Verify DTLS configuration on media endpoints.
2. Confirm SRTP is enforced (not optional).
3. Check packet rate limiting and flood protection.
4. Review media processing code for buffer handling safety.
5. Verify certificate fingerprint validation through signaling.
6. Test that encryption cannot be bypassed or downgraded.
7. Review SFU/MCU forwarding logic for stream validation.

### V17.3 -- Signaling

| ID | Requirement | Level |
|---|---|---|
| V17.3.1 | Signaling server runs over encrypted transport (WSS or HTTPS) | L1 |
| V17.3.2 | Signaling messages are validated for well-formed structure (SDP, ICE candidates) | L1 |
| V17.3.3 | Malformed signaling input is rejected without crashing the server | L1 |
| V17.3.4 | Signaling server maintains availability under load (rate limiting, connection limits) | L2 |
| V17.3.5 | Session establishment requires authenticated users | L1 |
| V17.3.6 | SDP manipulation attacks are prevented (no injection of unauthorized media lines) | L1 |
| V17.3.7 | ICE candidate filtering prevents IP address leakage when privacy is required | L2 |
| V17.3.8 | Signaling server validates session ownership (users can only modify their own sessions) | L1 |
| V17.3.9 | Re-INVITE and session modification attacks are prevented | L2 |
| V17.3.10 | Signaling message size limits prevent memory exhaustion | L1 |
| V17.3.11 | WebSocket connection limits prevent resource exhaustion on the signaling server | L2 |

**Audit Steps:**
1. Verify signaling transport is encrypted (WSS, not WS).
2. Review SDP parsing and validation logic.
3. Check input validation for ICE candidates and signaling messages.
4. Test signaling server behavior under malformed input.
5. Verify session authentication and ownership validation.
6. Review rate limiting and connection management.
7. Check for ICE candidate filtering/privacy options.

## Code Review Patterns

### Detecting TURN Configuration Issues

```bash
# TURN server configuration files
grep -rn "turn\|TURN\|coturn\|turnserver" --include="*.{conf,yml,yaml,json,toml,ini,cfg}"

# TURN without authentication
grep -rn "no-auth\|lt-cred-mech.*false\|anonymous\|auth.*none\|auth.*false" --include="*.{conf,yml,yaml,json}"

# Missing address filtering
grep -rn "denied-peer-ip\|allowed-peer-ip\|no-loopback-peers\|no-multicast-peers" --include="*.{conf,yml,yaml}"

# Plain TURN (not TURNS)
grep -rn "turn:\|3478\|urls.*turn:" --include="*.{js,ts,py,java,go,conf,yml,yaml}"

# Check for TURNS (TLS)
grep -rn "turns:\|5349\|urls.*turns:" --include="*.{js,ts,py,java,go,conf,yml,yaml}"

# Static TURN credentials (should be short-lived)
grep -rn "credential.*['\"].\{8,\}['\"]\|password.*['\"].\{8,\}['\"]" --include="*.{js,ts,py,java,go}" | grep -i turn
```

### Detecting Media Security Issues

```bash
# Check for DTLS/SRTP configuration
grep -rn "dtls\|DTLS\|srtp\|SRTP\|sdes\|SDES" --include="*.{js,ts,py,java,go,conf,yml,yaml}"

# Check for encryption bypass options
grep -rn "encryption.*false\|encrypt.*disable\|RtpTransceiver\|srtpCryptoSuite\|dtlsTransport" --include="*.{js,ts,py,java,go}"

# Check for DTLS fingerprint verification
grep -rn "fingerprint\|a=fingerprint\|dtlsFingerprint\|certificate.*fingerprint" --include="*.{js,ts,py,java,go}"

# Check RTCPeerConnection configuration
grep -rn "RTCPeerConnection\|PeerConnection\|createPeerConnection\|peerConnectionConfig" --include="*.{js,ts,jsx,tsx}"

# Check for media packet handling
grep -rn "ontrack\|addTrack\|addStream\|MediaStream\|getUserMedia\|getDisplayMedia" --include="*.{js,ts,jsx,tsx}"
```

### Detecting Signaling Security Issues

```bash
# WebSocket without TLS (ws:// instead of wss://)
grep -rn "ws://\|new WebSocket.*ws://" --include="*.{js,ts,jsx,tsx,py,java,go}"

# Check for SDP validation
grep -rn "setRemoteDescription\|setLocalDescription\|createOffer\|createAnswer\|RTCSessionDescription" --include="*.{js,ts,jsx,tsx}"

# SDP parsing without validation
grep -rn "SDP\|sdp\|sessionDescription\|remoteDescription" --include="*.{js,ts,py,java,go}"

# Missing message size limits on WebSocket
grep -rn "maxPayload\|maxMessageSize\|maxFrameSize\|payloadLengthLimit" --include="*.{js,ts,py,java,go,conf,yml,yaml}"

# Missing authentication on signaling
grep -rn "socket\.on\|io\.on\|ws\.on\|onmessage\|on_message" --include="*.{js,ts,py,java,go}"

# ICE candidate handling
grep -rn "iceCandidate\|addIceCandidate\|onicecandidate\|ice-candidate\|RTCIceCandidate" --include="*.{js,ts,jsx,tsx}"
```

### Detecting IP Privacy Issues

```bash
# ICE candidate policy (check for relay-only to hide IP)
grep -rn "iceCandidatePoolSize\|iceTransportPolicy\|relay\|all" --include="*.{js,ts,jsx,tsx}"

# mDNS candidate handling
grep -rn "mdns\|\.local\|candidateType.*host\|candidate.*host" --include="*.{js,ts,jsx,tsx}"

# IP address extraction from SDP
grep -rn "candidate.*\d\+\.\d\+\.\d\+\.\d\+\|c=IN IP4\|c=IN IP6" --include="*.{js,ts,py,java,go}"
```

## Remediation Guidance

### Secure TURN Server Configuration (coturn)

```ini
# coturn configuration (/etc/turnserver.conf)

# Require authentication
lt-cred-mech

# Use TLS (TURNS)
tls-listening-port=5349
cert=/etc/ssl/certs/turn.pem
pkey=/etc/ssl/private/turn.key
cipher-list="ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384"
no-tlsv1
no-tlsv1_1

# Address filtering - block private networks
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=100.64.0.0-100.127.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=169.254.0.0-169.254.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.0.0.0-192.0.0.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=::1
no-loopback-peers
no-multicast-peers

# Resource limits
total-quota=100
bps-capacity=0
max-bps=1000000
user-quota=12
stale-nonce=600

# Relay port range
min-port=49152
max-port=65535

# Logging
log-file=/var/log/turnserver/turn.log
simple-log
```

### Time-Limited TURN Credentials

```javascript
// Generate short-lived TURN credentials (HMAC-based)
const crypto = require('crypto');

function generateTurnCredentials(userId, secret, ttl = 86400) {
  const timestamp = Math.floor(Date.now() / 1000) + ttl;
  const username = `${timestamp}:${userId}`;
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(username);
  const credential = hmac.digest('base64');

  return {
    username,
    credential,
    ttl
  };
}

// API endpoint to provide TURN credentials
app.get('/api/turn-credentials', authenticate, (req, res) => {
  const credentials = generateTurnCredentials(
    req.user.id,
    process.env.TURN_SECRET,
    3600 // 1 hour TTL
  );

  res.json({
    iceServers: [{
      urls: [
        'turns:turn.example.com:5349?transport=tcp',
        'turn:turn.example.com:3478?transport=udp'
      ],
      username: credentials.username,
      credential: credentials.credential
    }]
  });
});
```

### Secure RTCPeerConnection Configuration

```javascript
// WRONG: Insecure peer connection setup
const pc = new RTCPeerConnection({
  iceServers: [{
    urls: 'turn:turn.example.com:3478', // Plain TURN, no TLS
    username: 'static_user',            // Static credentials
    credential: 'static_pass'           // Hardcoded credential
  }]
});

// CORRECT: Secure peer connection configuration
async function createSecurePeerConnection() {
  // Fetch short-lived credentials from authenticated endpoint
  const response = await fetch('/api/turn-credentials', {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  const { iceServers } = await response.json();

  const pc = new RTCPeerConnection({
    iceServers,
    iceTransportPolicy: 'relay',  // Use 'relay' for IP privacy
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceCandidatePoolSize: 0       // Minimize information leakage
  });

  // Validate DTLS fingerprint
  pc.addEventListener('iceconnectionstatechange', () => {
    if (pc.iceConnectionState === 'connected') {
      const stats = pc.getStats();
      // Verify DTLS certificate fingerprint matches signaling exchange
    }
  });

  return pc;
}
```

### SDP Validation

```javascript
// Validate SDP before setting remote description
function validateSDP(sdp) {
  // Check for required fields
  if (!sdp || typeof sdp !== 'string') {
    throw new Error('Invalid SDP: must be a non-empty string');
  }

  // Size limit to prevent memory exhaustion
  if (sdp.length > 10000) {
    throw new Error('SDP exceeds maximum allowed size');
  }

  // Verify required SDP lines
  const requiredFields = ['v=', 'o=', 's=', 't='];
  for (const field of requiredFields) {
    if (!sdp.includes(field)) {
      throw new Error(`Invalid SDP: missing required field ${field}`);
    }
  }

  // Ensure DTLS fingerprint is present (encryption required)
  if (!sdp.includes('a=fingerprint:')) {
    throw new Error('Invalid SDP: missing DTLS fingerprint');
  }

  // Ensure SRTP is used (not plain RTP)
  if (sdp.includes('RTP/AVP') && !sdp.includes('RTP/SAVPF') && !sdp.includes('RTP/SAVP')) {
    throw new Error('Invalid SDP: must use SRTP (RTP/SAVPF)');
  }

  // Prevent SDP injection (no unexpected media lines)
  const mediaLines = sdp.match(/^m=/gm);
  if (mediaLines && mediaLines.length > 5) {
    throw new Error('Invalid SDP: too many media lines');
  }

  return true;
}

// Usage
pc.addEventListener('signalingstatechange', () => {
  // Validate before setting
});

async function handleOffer(sdpString) {
  validateSDP(sdpString);
  await pc.setRemoteDescription(new RTCSessionDescription({
    type: 'offer',
    sdp: sdpString
  }));
}
```

### ICE Candidate Filtering for Privacy

```javascript
// Filter ICE candidates to prevent IP leakage
function filterIceCandidate(candidate) {
  if (!candidate || !candidate.candidate) return null;

  const candidateStr = candidate.candidate;

  // Block host candidates (reveals local IP)
  if (candidateStr.includes('typ host')) {
    return null; // Filter out host candidates
  }

  // Block server reflexive candidates if strict privacy needed
  // (reveals public IP before TURN relay)
  if (candidateStr.includes('typ srflx')) {
    return null; // Only allow relay candidates
  }

  // Only allow relay candidates for maximum privacy
  if (!candidateStr.includes('typ relay')) {
    return null;
  }

  return candidate;
}

// Apply filtering
pc.addEventListener('icecandidate', (event) => {
  if (event.candidate) {
    const filtered = filterIceCandidate(event.candidate);
    if (filtered) {
      // Send to signaling server
      signalingChannel.send(JSON.stringify({
        type: 'ice-candidate',
        candidate: filtered
      }));
    }
  }
});
```

### Signaling Server Security

```javascript
const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({
  server,
  maxPayload: 16 * 1024,      // 16KB max message size
  clientTracking: true,
  perMessageDeflate: false      // Disable to prevent compression attacks
});

// Connection rate limiting
const connectionCounts = new Map();
const MAX_CONNECTIONS_PER_IP = 10;
const MESSAGE_RATE_LIMIT = 60;  // messages per minute

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;

  // Connection limit per IP
  const count = connectionCounts.get(ip) || 0;
  if (count >= MAX_CONNECTIONS_PER_IP) {
    ws.close(1008, 'Too many connections');
    return;
  }
  connectionCounts.set(ip, count + 1);

  // Message rate limiting
  let messageCount = 0;
  const rateLimitReset = setInterval(() => { messageCount = 0; }, 60000);

  // Authenticate user
  const token = new URL(req.url, 'http://localhost').searchParams.get('token');
  const user = verifyAuthToken(token);
  if (!user) {
    ws.close(1008, 'Authentication required');
    return;
  }

  ws.on('message', (data) => {
    messageCount++;
    if (messageCount > MESSAGE_RATE_LIMIT) {
      ws.close(1008, 'Rate limit exceeded');
      return;
    }

    try {
      const message = JSON.parse(data);

      // Validate message structure
      if (!message.type || typeof message.type !== 'string') {
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
        return;
      }

      // Validate session ownership
      if (message.sessionId && !isSessionOwner(user.id, message.sessionId)) {
        ws.send(JSON.stringify({ error: 'Unauthorized session access' }));
        logger.warn({
          event: 'signaling.unauthorized',
          userId: user.id,
          sessionId: message.sessionId
        });
        return;
      }

      // Handle valid message types
      switch (message.type) {
        case 'offer':
        case 'answer':
          validateSDP(message.sdp);
          forwardToSession(message);
          break;
        case 'ice-candidate':
          validateIceCandidate(message.candidate);
          forwardToSession(message);
          break;
        default:
          ws.send(JSON.stringify({ error: 'Unknown message type' }));
      }
    } catch (err) {
      logger.error({ event: 'signaling.error', error: err.message });
      ws.send(JSON.stringify({ error: 'Invalid message' }));
    }
  });

  ws.on('close', () => {
    clearInterval(rateLimitReset);
    const current = connectionCounts.get(ip) || 1;
    connectionCounts.set(ip, current - 1);
  });
});
```

## ASVS Level Reference

| Section | L1 | L2 | L3 |
|---|---|---|---|
| V17.1 TURN Server | Required | Required | Required |
| V17.2 Media | Required | Required | Required |
| V17.3 Signaling | Required | Required | Required |

## References

- [OWASP ASVS V17 -- WebRTC](https://owasp.org/www-project-application-security-verification-standard/)
- [WebRTC Security Architecture (RFC 8827)](https://datatracker.ietf.org/doc/html/rfc8827)
- [SRTP (RFC 3711)](https://datatracker.ietf.org/doc/html/rfc3711)
- [DTLS 1.2 (RFC 6347)](https://datatracker.ietf.org/doc/html/rfc6347)
- [TURN Protocol (RFC 8656)](https://datatracker.ietf.org/doc/html/rfc8656)
- [ICE (RFC 8445)](https://datatracker.ietf.org/doc/html/rfc8445)
- [WebRTC IP Address Handling (RFC 8828)](https://datatracker.ietf.org/doc/html/rfc8828)
- [coturn TURN Server Documentation](https://github.com/coturn/coturn)
