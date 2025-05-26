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
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      this.connected = response.ok;
      return this.connected;
    } catch (error) {
      console.error('Database connection test failed:', error);
      this.connected = false;
      return false;
    }
  }

  // Convert our note format to database format
  noteToDbFormat(note) {
    return {
      title: note.title || '',
      description: note.text || '',
      created_at: note.creationDate || note.timestamp || new Date().toISOString(),
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
      
      const response = await fetch(`${this.baseUrl}/crud/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table_name: 'notes',
          values: values
        })
      });

      const result = await response.json();
      if (result.success) {
        // Store the database ID with the note
        const insertedId = result.inserted_id;
        if (insertedId && insertedId !== -1) {
          // Handle tags
          if (note.tags && note.tags.length > 0) {
            await this.syncNoteTags(insertedId, note.tags);
          }
          return { success: true, db_id: insertedId };
        }
      }
      return { success: false, message: result.message };
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
      
      const response = await fetch(`${this.baseUrl}/crud/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table_name: 'notes',
          values: values,
          where_clause: `id = ${note.db_id}`
        })
      });

      const result = await response.json();
      if (result.success) {
        // Update tags
        if (note.tags) {
          await this.syncNoteTags(note.db_id, note.tags);
        }
      }
      return result;
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
      await fetch(`${this.baseUrl}/crud/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table_name: 'note_tags',
          where_clause: `note_id = ${dbId}`
        })
      });

      // Then delete the note
      const response = await fetch(`${this.baseUrl}/crud/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table_name: 'notes',
          where_clause: `id = ${dbId}`
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to delete note:', error);
      return { success: false, message: error.message };
    }
  }

  // Query notes with optional filters
  async queryNotes(whereClause = '', limit = 1000) {
    try {
      let sql = 'SELECT * FROM notes';
      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }
      sql += ` ORDER BY created_at DESC LIMIT ${limit}`;

      const response = await fetch(`${this.baseUrl}/crud/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: sql,
          parameters: {}
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
      // First try to find existing tag
      const response = await fetch(`${this.baseUrl}/crud/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: 'SELECT id FROM tags WHERE name = ?',
          parameters: { name: tagName }
        })
      });

      const result = await response.json();
      if (result.result_set && result.result_set.rows && result.result_set.rows.length > 0) {
        const tagId = result.result_set.rows[0].values[0].int_value;
        return tagId;
      }

      // Create new tag
      const insertResponse = await fetch(`${this.baseUrl}/crud/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table_name: 'tags',
          values: { name: tagName }
        })
      });

      const insertResult = await insertResponse.json();
      if (insertResult.success) {
        return insertResult.inserted_id;
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
      await fetch(`${this.baseUrl}/crud/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table_name: 'note_tags',
          where_clause: `note_id = ${noteId}`
        })
      });

      // Add new tag associations
      for (const tagName of tags) {
        const tagId = await this.getOrCreateTag(tagName);
        if (tagId) {
          await fetch(`${this.baseUrl}/crud/insert`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              table_name: 'note_tags',
              values: {
                note_id: noteId,
                tag_id: tagId
              }
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
      const response = await fetch(`${this.baseUrl}/crud/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `SELECT t.name FROM tags t 
                JOIN note_tags nt ON t.id = nt.tag_id 
                WHERE nt.note_id = ${noteId}`,
          parameters: {}
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
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DatabaseClient;
}