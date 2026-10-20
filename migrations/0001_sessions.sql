CREATE TABLE music_device_sessions (
  token_hash TEXT PRIMARY KEY CHECK (length(token_hash) = 64),
  origin TEXT NOT NULL,
  public_jwk TEXT NOT NULL,
  credential_cipher TEXT,
  qr_cipher TEXT,
  qr_key_hash TEXT,
  qr_expires_at INTEGER,
  qr_generation INTEGER NOT NULL DEFAULT 0 CHECK (qr_generation >= 0 AND qr_generation <= 9007199254740991),
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX music_device_sessions_expiry ON music_device_sessions (expires_at);

-- No cascading deletes: nonce cleanup remains bounded independently of sessions.
CREATE TABLE music_device_nonces (
  token_hash TEXT NOT NULL,
  nonce_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (token_hash, nonce_hash)
);
CREATE INDEX music_device_nonces_expiry ON music_device_nonces (expires_at);

CREATE TABLE music_rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX music_rate_limits_expiry ON music_rate_limits (expires_at);
