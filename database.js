// Database client for Post-it Notes
// Uses HTTP/JSON to communicate with gRPC server through a proxy

class DatabaseClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.connected = false;
  }

  // Test connection to the database
  async testConnection() {
    try {
      console.log('Testing database connection to:', this.baseUrl);
      // Test with a simple query
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: "SELECT 1",
          database: "default"
        })
      });
      
      console.log('Connection test response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Connection test failed with status:', response.status, 'Error:', errorText);
        
        // Try to parse error for better messaging
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error && errorData.error.includes('Database') && errorData.error.includes('not found')) {
            console.warn('Database not found - it may need to be created from schema');
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
      
      this.connected = response.ok;
      return this.connected;
    } catch (error) {
      console.error('Database connection test failed with error:', error.message, error);
      this.connected = false;
      return false;
    }
  }

  // Convert our note format to database format
  noteToDbFormat(note) {
    // If no title provided, use first 40 characters of description
    let title = note.title;
    if (!title || title.trim() === '') {
      const description = note.text || '';
      title = description.substring(0, 40);
      if (description.length > 40) {
        title += '...';
      }
    }
    
    return {
      title: title || 'Untitled Note',
      description: note.text || '',
      created_at: note.creationDate || note.timestamp || new Date().toISOString(),
      created_by: note.createdBy || note.userName || null,
      status: note.status || 'open',
      priority: note.priority || 'medium',
      url: note.url || null
    };
  }

  // Convert database format to our note format
  dbToNoteFormat(dbNote) {
    return {
      id: dbNote.id?.toString() || dbNote.db_id,
      db_id: dbNote.id, // Keep track of database ID
      title: dbNote.title || '',
      text: dbNote.description || '',
      creationDate: dbNote.created_at,
      timestamp: dbNote.created_at,
      lastUpdated: dbNote.last_updated || dbNote.created_at,
      createdBy: dbNote.created_by || '',
      status: dbNote.status || 'open',
      priority: dbNote.priority || 'medium',
      url: dbNote.url || '',
      tags: [] // Tags will be loaded separately
    };
  }

  // Insert a new note
  async insertNote(note) {
    try {
      const values = this.noteToDbFormat(note);
      
      // Use SQL INSERT with escaped values
      const escapeSql = (str) => {
        if (str === null || str === undefined) return 'NULL';
        return `'${String(str).replace(/'/g, "''")}'`;
      };
      
      const sql = `INSERT INTO notes (title, description, created_at, created_by, status, priority, url, last_updated) 
                   VALUES (${escapeSql(values.title)}, ${escapeSql(values.description)}, ${escapeSql(values.created_at)}, ${escapeSql(values.created_by)}, ${escapeSql(values.status)}, ${escapeSql(values.priority)}, ${escapeSql(values.url)}, ${escapeSql(values.created_at)})`;
      
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: sql,
          parameters: {},
          database: 'default'
        })
      });

      const result = await response.json();
      if (result.result_set && !result.error) {
        // Get the inserted ID using last_insert_rowid()
        const idResponse = await fetch(`${this.baseUrl}/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sql: "SELECT last_insert_rowid() as id",
            parameters: {},
            database: 'default'
          })
        });
        
        const idResult = await idResponse.json();
        if (idResult.result_set && idResult.result_set.rows && idResult.result_set.rows.length > 0) {
          const insertedId = idResult.result_set.rows[0].values[0].int_value;
          
          // Handle tags
          if (note.tags && note.tags.length > 0) {
            await this.syncNoteTags(insertedId, note.tags);
          }
          return { success: true, db_id: insertedId };
        }
      }
      return { success: false, message: result.error || 'Insert failed' };
    } catch (error) {
      console.error('Failed to insert note:', error);
      return { success: false, message: error.message };
    }
  }

  // Update an existing note
  async updateNote(note) {
    if (!note.db_id) {
      return { success: false, message: 'No database ID for note' };
    }

    try {
      const values = this.noteToDbFormat(note);
      
      const escapeSql = (str) => {
        if (str === null || str === undefined) return 'NULL';
        return `'${String(str).replace(/'/g, "''")}'`;
      };
      
      const sql = `UPDATE notes SET 
                   title = ${escapeSql(values.title)},
                   description = ${escapeSql(values.description)},
                   created_at = ${escapeSql(values.created_at)},
                   created_by = ${escapeSql(values.created_by)},
                   status = ${escapeSql(values.status)},
                   priority = ${escapeSql(values.priority)},
                   url = ${escapeSql(values.url)},
                   last_updated = CURRENT_TIMESTAMP
                   WHERE id = ${note.db_id}`;
      
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: sql,
          parameters: {},
          database: 'default'
        })
      });

      const result = await response.json();
      if (result.result_set && !result.error) {
        // Update tags
        if (note.tags) {
          await this.syncNoteTags(note.db_id, note.tags);
        }
        return { success: true };
      }
      return { success: false, message: result.error || 'Update failed' };
    } catch (error) {
      console.error('Failed to update note:', error);
      return { success: false, message: error.message };
    }
  }

  // Delete a note
  async deleteNote(noteId, dbId) {
    if (!dbId) {
      return { success: false, message: 'No database ID for note' };
    }

    try {
      // First delete tag associations
      const deleteTagsSql = `DELETE FROM note_tags WHERE note_id = ${dbId}`;
      await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: deleteTagsSql,
          parameters: {},
          database: 'default'
        })
      });

      // Then delete the note
      const deleteNoteSql = `DELETE FROM notes WHERE id = ${dbId}`;
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: deleteNoteSql,
          parameters: {},
          database: 'default'
        })
      });

      const result = await response.json();
      if (result.result_set && !result.error) {
        return { success: true };
      }
      return { success: false, message: result.error || 'Delete failed' };
    } catch (error) {
      console.error('Failed to delete note:', error);
      return { success: false, message: error.message };
    }
  }

  // Get all notes (alias for queryNotes with no filters)
  async getNotes() {
    return this.queryNotes();
  }

  // Query notes with optional filters
  async queryNotes(whereClause = '', limit = 1000) {
    try {
      let sql = 'SELECT * FROM notes';
      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }
      sql += ` ORDER BY created_at DESC LIMIT ${limit}`;

      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: sql,
          parameters: {},
          database: 'default'
        })
      });

      const result = await response.json();
      if (result.error) {
        console.error('Query error:', result.error);
        return [];
      }

      // Convert results to our note format
      const notes = [];
      if (result.result_set && result.result_set.rows) {
        for (const row of result.result_set.rows) {
          const dbNote = this.rowToObject(result.result_set.columns, row);
          const note = this.dbToNoteFormat(dbNote);
          
          // Load tags for this note
          const tags = await this.getNoteTags(dbNote.id);
          note.tags = tags;
          
          notes.push(note);
        }
      }

      return notes;
    } catch (error) {
      console.error('Failed to query notes:', error);
      return [];
    }
  }

  // Convert a row to an object using column metadata
  rowToObject(columns, row) {
    const obj = {};
    columns.forEach((col, index) => {
      const value = row.values[index];
      // Extract the actual value based on the type
      if (value.string_value !== undefined) {
        obj[col.name] = value.string_value;
      } else if (value.int_value !== undefined) {
        obj[col.name] = value.int_value;
      } else if (value.bool_value !== undefined) {
        obj[col.name] = value.bool_value;
      } else if (value.null_value !== undefined) {
        obj[col.name] = null;
      } else {
        obj[col.name] = value;
      }
    });
    return obj;
  }

  // Get or create a tag
  async getOrCreateTag(tagName) {
    try {
      const escapeSql = (str) => {
        if (str === null || str === undefined) return 'NULL';
        return `'${String(str).replace(/'/g, "''")}'`;
      };
      
      // First try to find existing tag
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `SELECT id FROM tags WHERE name = ${escapeSql(tagName)}`,
          parameters: {},
          database: 'default'
        })
      });

      const result = await response.json();
      if (result.result_set && result.result_set.rows && result.result_set.rows.length > 0) {
        const tagId = result.result_set.rows[0].values[0].int_value;
        return tagId;
      }

      // Create new tag
      const insertResponse = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `INSERT INTO tags (name) VALUES (${escapeSql(tagName)})`,
          parameters: {},
          database: 'default'
        })
      });

      const insertResult = await insertResponse.json();
      if (insertResult.result_set && !insertResult.error) {
        // Get the inserted ID
        const idResponse = await fetch(`${this.baseUrl}/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sql: "SELECT last_insert_rowid() as id",
            parameters: {},
            database: 'default'
          })
        });
        
        const idResult = await idResponse.json();
        if (idResult.result_set && idResult.result_set.rows && idResult.result_set.rows.length > 0) {
          return idResult.result_set.rows[0].values[0].int_value;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get/create tag:', error);
      return null;
    }
  }

  // Sync tags for a note
  async syncNoteTags(noteId, tags) {
    try {
      // Delete existing tag associations
      const deleteTagsSql = `DELETE FROM note_tags WHERE note_id = ${noteId}`;
      await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: deleteTagsSql,
          parameters: {},
          database: 'default'
        })
      });

      // Add new tag associations
      for (const tagName of tags) {
        const tagId = await this.getOrCreateTag(tagName);
        if (tagId) {
          const insertSql = `INSERT INTO note_tags (note_id, tag_id) VALUES (${noteId}, ${tagId})`;
          await fetch(`${this.baseUrl}/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sql: insertSql,
              parameters: {},
              database: 'default'
            })
          });
        }
      }
    } catch (error) {
      console.error('Failed to sync tags:', error);
    }
  }

  // Get tags for a note
  async getNoteTags(noteId) {
    try {
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `SELECT t.name FROM tags t 
                JOIN note_tags nt ON t.id = nt.tag_id 
                WHERE nt.note_id = ${noteId}`,
          parameters: {},
          database: 'default'
        })
      });

      const result = await response.json();
      const tags = [];
      
      if (result.result_set && result.result_set.rows) {
        for (const row of result.result_set.rows) {
          tags.push(row.values[0].string_value);
        }
      }

      return tags;
    } catch (error) {
      console.error('Failed to get note tags:', error);
      return [];
    }
  }

  // Sync all local notes to database
  async syncAllNotes(localNotes) {
    const results = {
      synced: 0,
      failed: 0,
      errors: []
    };

    for (const note of localNotes) {
      try {
        if (note.db_id) {
          // Update existing
          const result = await this.updateNote(note);
          if (result.success) {
            results.synced++;
          } else {
            results.failed++;
            results.errors.push({ note: note.id, error: result.message });
          }
        } else {
          // Insert new
          const result = await this.insertNote(note);
          if (result.success) {
            // Store the database ID with the local note
            note.db_id = result.db_id;
            results.synced++;
          } else {
            results.failed++;
            results.errors.push({ note: note.id, error: result.message });
          }
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ note: note.id, error: error.message });
      }
    }

    return results;
  }
}

// Export for use in other files
export default DatabaseClient;

// Also make available on window for non-module scripts
if (typeof window !== 'undefined') {
  window.DatabaseClient = DatabaseClient;
}