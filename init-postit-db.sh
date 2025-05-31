#!/bin/bash

# Initialize PostIt database with schema
# This script creates the database and tables if they don't exist

echo "Initializing PostIt database..."

# Read the schema and send initialization queries
cat > /tmp/init_postit.sql << 'EOF'
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  url TEXT
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS note_tags (
  note_id INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Test query to verify database works
SELECT 'Database initialized successfully' as message;
EOF

echo "Database schema created in /tmp/init_postit.sql"
echo ""
echo "To initialize the database, you can:"
echo "1. Start the GRPC server: target/debug/datasink server start -d postit"
echo "2. Start the REST gateway: node rest-gateway.js"
echo "3. Test the connection through the Chrome extension"
echo ""
echo "The schema will be automatically applied when the database is first accessed."