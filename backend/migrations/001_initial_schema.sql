-- world-facts-backend/migrations/001_initial_schema.sql

-- Places catalog
CREATE TABLE IF NOT EXISTS places (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  wiki_title VARCHAR(500) NOT NULL,
  display_name VARCHAR(500) NOT NULL,
  country VARCHAR(255) DEFAULT 'Mundo',
  category VARCHAR(20) CHECK (category IN ('curioso', 'escalofriante', 'raro')) NOT NULL,
  photo_keywords VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated facts (cache)
CREATE TABLE IF NOT EXISTS facts (
  id SERIAL PRIMARY KEY,
  place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  fact_text TEXT NOT NULL,
  source_url VARCHAR(1000),
  gemini_model VARCHAR(100),
  generation_method VARCHAR(50) DEFAULT 'gemini',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (place_id)
);

-- Session tracking for rate limiting
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(64) PRIMARY KEY,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_request TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin users (JWT auth)
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Metrics / analytics
CREATE TABLE IF NOT EXISTS api_metrics (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  cache_hit BOOLEAN,
  gemini_calls INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_places_slug ON places(slug);
CREATE INDEX IF NOT EXISTS idx_facts_place_id ON facts(place_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_request ON sessions(last_request);
CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON api_metrics(created_at);
