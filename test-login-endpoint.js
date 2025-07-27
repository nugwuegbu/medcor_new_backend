#!/usr/bin/env node

import https from 'https';
import http from 'http';

// Test authentication endpoint
async function testLoginEndpoint() {
    console.log('🔍 Testing Authentication Endpoints...\n');
    
    const endpoints = [
        'http://localhost:8000/api/auth/login/',
        'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/api/auth/login/'
    ];
    
    const testData = JSON.stringify({
        email: "admin@localhost",
        password: "admin123"
    });
    
    for (const url of endpoints) {
        try {
            console.log(`Testing: ${url}`);
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(testData),
                    'Accept': '*/*'
                }
            };
            
            await new Promise((resolve, reject) => {
                const req = client.request(options, (res) => {
                    let data = '';
                    
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    
                    res.on('end', () => {
                        if (res.statusCode === 200 || res.statusCode === 201) {
                            console.log(`✅ ${url} - ${res.statusCode} OK`);
                            try {
                                const jsonData = JSON.parse(data);
                                console.log(`   🔑 Token received: ${jsonData.access ? 'Yes' : 'No'}`);
                            } catch (e) {
                                console.log(`   📄 Response: ${data.substring(0, 100)}...`);
                            }
                        } else {
                            console.log(`❌ ${url} - ${res.statusCode} ${res.statusMessage}`);
                            console.log(`   📄 Error: ${data.substring(0, 200)}...`);
                        }
                        resolve();
                    });
                });
                
                req.on('error', (err) => {
                    console.log(`❌ ${url} - Connection Error: ${err.message}`);
                    resolve();
                });
                
                req.setTimeout(10000, () => {
                    console.log(`❌ ${url} - Timeout`);
                    req.destroy();
                    resolve();
                });
                
                req.write(testData);
                req.end();
            });
            
        } catch (error) {
            console.log(`❌ ${url} - Error: ${error.message}`);
        }
        
        console.log(''); // Add spacing
    }
}

// Test API docs endpoints 
async function testDocsEndpoints() {
    console.log('📋 Testing API Documentation Endpoints...\n');
    
    const endpoints = [
        'http://localhost:8000/api/docs/',
        'http://localhost:8000/api/swagger/',
        'http://localhost:8000/api/redoc/',
        'http://localhost:8000/api/schema/'
    ];
    
    for (const url of endpoints) {
        try {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 80,
                path: urlObj.pathname,
                method: 'GET'
            };
            
            await new Promise((resolve) => {
                const req = http.request(options, (res) => {
                    if (res.statusCode === 200) {
                        console.log(`✅ ${url} - 200 OK`);
                    } else {
                        console.log(`❌ ${url} - ${res.statusCode} ${res.statusMessage}`);
                    }
                    resolve();
                });
                
                req.on('error', (err) => {
                    console.log(`❌ ${url} - Error: ${err.message}`);
                    resolve();
                });
                
                req.setTimeout(5000, () => {
                    console.log(`❌ ${url} - Timeout`);
                    req.destroy();
                    resolve();
                });
                
                req.end();
            });
            
        } catch (error) {
            console.log(`❌ ${url} - Error: ${error.message}`);
        }
    }
}

async function main() {
    console.log('🧪 MedCor Django API Endpoint Testing\n');
    console.log('═'.repeat(50));
    
    await testDocsEndpoints();
    console.log('═'.repeat(50));
    await testLoginEndpoint();
    
    console.log('═'.repeat(50));
    console.log('✅ API Testing Complete!');
}

main().catch(console.error);