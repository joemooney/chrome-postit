#!/usr/bin/env node

// REST API Gateway for GRPC DataSink
// Translates HTTP/JSON requests to GRPC calls for browser compatibility

const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 8080;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Load the proto file
const PROTO_PATH = path.join(__dirname, '../datasink/proto/datasink.proto');
let DataSink = null;
let client = null;

try {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [path.join(__dirname, '../datasink/proto')]
  });
  
  const datasink = grpc.loadPackageDefinition(packageDefinition).datasink;
  DataSink = datasink.DataSink;
  
  // Connect to GRPC server
  client = new DataSink('127.0.0.1:50051', grpc.credentials.createInsecure());
  console.log('Connected to GRPC server at 127.0.0.1:50051');
} catch (error) {
  console.error('Failed to load proto or connect to GRPC:', error);
  process.exit(1);
}

// Helper function to handle GRPC streaming calls (like Query)
function makeGrpcCall(method, request, res) {
  let responseHandled = false;
  
  const call = client[method](request);
  
  call.on('data', (response) => {
    if (!responseHandled) {
      responseHandled = true;
      res.json(response);
    }
  });
  
  call.on('error', (error) => {
    if (!responseHandled) {
      responseHandled = true;
      console.error(`${method} error:`, error.message);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        code: error.code 
      });
    }
  });
  
  call.on('end', () => {
    if (!responseHandled) {
      responseHandled = true;
      res.status(500).json({ 
        success: false, 
        error: 'No response received from server' 
      });
    }
  });
}

// Helper function to handle GRPC unary calls (like Insert, Update, Delete, admin operations)
function makeUnaryGrpcCall(method, request, res) {
  client[method](request, (error, response) => {
    if (error) {
      console.error(`${method} error:`, error.message);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        code: error.code 
      });
    } else {
      res.json(response);
    }
  });
}

// Query endpoint
app.post('/query', (req, res) => {
  const { sql, parameters = {}, database = 'postit' } = req.body;
  
  console.log('Query request:', { sql, database });
  
  // Convert parameters to gRPC Value format
  const grpcParameters = {};
  for (const [key, value] of Object.entries(parameters)) {
    if (typeof value === 'string') {
      grpcParameters[key] = { string_value: value };
    } else if (typeof value === 'number') {
      grpcParameters[key] = { int_value: value };
    } else if (typeof value === 'boolean') {
      grpcParameters[key] = { bool_value: value };
    } else if (value === null) {
      grpcParameters[key] = { null_value: true };
    }
  }
  
  const request = {
    sql: sql,
    parameters: grpcParameters,
    database: database
  };
  
  makeGrpcCall('Query', request, res);
});

// Insert endpoint
app.post('/insert', (req, res) => {
  const { table_name, values, database = 'default' } = req.body;
  
  console.log('Insert request:', { table_name, values, database });
  
  // Convert values to gRPC Value format
  const grpcValues = {};
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string') {
      grpcValues[key] = { string_value: value };
    } else if (typeof value === 'number') {
      grpcValues[key] = { int_value: value };
    } else if (typeof value === 'boolean') {
      grpcValues[key] = { bool_value: value };
    } else if (value === null) {
      grpcValues[key] = { null_value: true };
    }
  }
  
  console.log('Converted gRPC values:', JSON.stringify(grpcValues, null, 2));
  
  const request = {
    table_name: table_name,
    values: grpcValues,
    database: database
  };
  
  makeUnaryGrpcCall('Insert', request, res);
});

// Update endpoint
app.post('/update', (req, res) => {
  const { table_name, values, where_clause, database = 'postit' } = req.body;
  
  console.log('Update request:', { table_name, values, where_clause, database });
  
  // Convert values to gRPC Value format
  const grpcValues = {};
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string') {
      grpcValues[key] = { string_value: value };
    } else if (typeof value === 'number') {
      grpcValues[key] = { int_value: value };
    } else if (typeof value === 'boolean') {
      grpcValues[key] = { bool_value: value };
    } else if (value === null) {
      grpcValues[key] = { null_value: true };
    }
  }
  
  const request = {
    table_name: table_name,
    values: grpcValues,
    where_clause: where_clause,
    database: database
  };
  
  makeUnaryGrpcCall('Update', request, res);
});

// Delete endpoint
app.post('/delete', (req, res) => {
  const { table_name, where_clause, database = 'postit' } = req.body;
  
  console.log('Delete request:', { table_name, where_clause, database });
  
  const request = {
    table_name: table_name,
    where_clause: where_clause,
    database: database
  };
  
  makeUnaryGrpcCall('Delete', request, res);
});

// Server status endpoint  
app.post('/server-status', (req, res) => {
  console.log('Server status request');
  
  const request = {};
  makeUnaryGrpcCall('GetServerStatus', request, res);
});

// Add database endpoint
app.post('/add-database', (req, res) => {
  const { name, url } = req.body;
  
  console.log('Add database request:', { name, url });
  
  const request = {
    name: name,
    url: url
  };
  
  makeUnaryGrpcCall('AddDatabase', request, res);
});

// Create table endpoint
app.post('/create-table', (req, res) => {
  const { table_name, columns, database = 'postit' } = req.body;
  
  console.log('Create table request:', { table_name, columns, database });
  
  const request = {
    table_name: table_name,
    columns: columns,
    database: database
  };
  
  makeUnaryGrpcCall('CreateTable', request, res);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`REST Gateway running on port ${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /query - Execute SQL queries');
  console.log('  POST /insert - Insert records');
  console.log('  POST /update - Update records');
  console.log('  POST /delete - Delete records');
  console.log('  GET /health - Health check');
});