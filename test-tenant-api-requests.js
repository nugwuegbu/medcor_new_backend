#!/usr/bin/env node

/**
 * Multi-Tenant API Testing Tool
 * Tests API requests to different tenants in the MedCor healthcare platform
 */

const BASE_URL_LOCAL = 'http://localhost:8000';
const BASE_URL_REPLIT = 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000';

// Test tenant configurations
const TENANTS = [
    {
        name: 'Public Schema',
        domain: 'localhost:8000',
        schema: 'public',
        testUser: { email: 'admin@localhost', password: 'admin123' }
    },
    {
        name: 'MedCor Hospital',
        domain: 'medcorhospital.localhost:8000',
        schema: 'medcorhospital',
        testUser: { email: 'hospital@localhost', password: 'hospital123' }
    },
    {
        name: 'MedCor Clinic',
        domain: 'medcorclinic.localhost:8000', 
        schema: 'medcorclinic',
        testUser: { email: 'clinic@localhost', password: 'clinic123' }
    }
];

async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.text();
        let jsonData = null;
        
        try {
            jsonData = JSON.parse(data);
        } catch {
            jsonData = data.substring(0, 200) + (data.length > 200 ? '...' : '');
        }
        
        return {
            status: response.status,
            statusText: response.statusText,
            data: jsonData,
            success: response.ok
        };
    } catch (error) {
        return {
            status: 0,
            statusText: 'Network Error',
            data: error.message,
            success: false
        };
    }
}

async function testTenantLogin(tenant, baseUrl) {
    console.log(`\n🔐 Testing Login for ${tenant.name}:`);
    console.log(`   Domain: ${tenant.domain}`);
    console.log(`   Schema: ${tenant.schema}`);
    
    const loginUrl = `${baseUrl}/api/auth/login/`;
    const headers = {
        'Host': tenant.domain
    };
    
    const result = await makeRequest(loginUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(tenant.testUser)
    });
    
    if (result.success) {
        console.log(`   ✅ Login successful - Status: ${result.status}`);
        console.log(`   🔑 Token received: ${result.data.access_token ? 'Yes' : 'No'}`);
        return result.data.access_token;
    } else {
        console.log(`   ❌ Login failed - Status: ${result.status}`);
        console.log(`   📄 Error: ${JSON.stringify(result.data).substring(0, 100)}...`);
        return null;
    }
}

async function testTenantAPI(tenant, baseUrl, token) {
    console.log(`\n📊 Testing API Endpoints for ${tenant.name}:`);
    
    const headers = {
        'Host': tenant.domain,
        'Authorization': token ? `Bearer ${token}` : undefined
    };
    
    const endpoints = [
        '/api/',
        '/api/tenants/',
        '/api/medical/patients/',
        '/api/medical/doctors/',
        '/api/medical/appointments/'
    ];
    
    for (const endpoint of endpoints) {
        const url = `${baseUrl}${endpoint}`;
        const result = await makeRequest(url, { headers });
        
        const statusIcon = result.success ? '✅' : '❌';
        console.log(`   ${statusIcon} ${endpoint} - ${result.status} ${result.statusText}`);
        
        if (result.success && typeof result.data === 'object') {
            const dataInfo = result.data.results 
                ? `${result.data.results.length} items`
                : typeof result.data === 'object' 
                    ? `${Object.keys(result.data).length} fields`
                    : 'data received';
            console.log(`      📄 Response: ${dataInfo}`);
        }
    }
}

async function testTenantSchema(tenant, baseUrl) {
    console.log(`\n🗄️  Testing Schema Access for ${tenant.name}:`);
    
    const headers = {
        'Host': tenant.domain
    };
    
    const schemaEndpoints = [
        '/api/docs/',
        '/api/schema/'
    ];
    
    for (const endpoint of schemaEndpoints) {
        const url = `${baseUrl}${endpoint}`;
        const result = await makeRequest(url, { headers });
        
        const statusIcon = result.success ? '✅' : '❌';
        console.log(`   ${statusIcon} ${endpoint} - ${result.status} ${result.statusText}`);
        
        if (result.success) {
            const size = typeof result.data === 'string' 
                ? `${Math.round(result.data.length / 1024)}KB`
                : 'Available';
            console.log(`      📄 Schema: ${size}`);
        }
    }
}

async function main() {
    console.log('🏥 MedCor Multi-Tenant API Testing Tool\n');
    console.log('═'.repeat(60));
    
    // Test both local and Replit URLs
    const baseUrls = [BASE_URL_LOCAL, BASE_URL_REPLIT];
    
    for (const baseUrl of baseUrls) {
        console.log(`\n🌐 Testing Base URL: ${baseUrl}`);
        console.log('═'.repeat(60));
        
        for (const tenant of TENANTS) {
            console.log(`\n🏢 Testing Tenant: ${tenant.name}`);
            console.log('─'.repeat(40));
            
            // Test login and get token
            const token = await testTenantLogin(tenant, baseUrl);
            
            // Test API endpoints with/without authentication
            await testTenantAPI(tenant, baseUrl, token);
            
            // Test schema access
            await testTenantSchema(tenant, baseUrl);
        }
        
        console.log('\n' + '═'.repeat(60));
    }
    
    console.log('\n✅ Multi-Tenant API Testing Complete!');
    console.log('\n💡 Usage Tips:');
    console.log('• Use Host header to specify tenant domain');
    console.log('• Each tenant has isolated data and users');  
    console.log('• Authentication tokens are tenant-specific');
    console.log('• API endpoints return tenant-filtered data');
    console.log('\n📚 Example cURL command for tenant requests:');
    console.log('curl -H "Host: medcorhospital.localhost:8000" \\');
    console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
    console.log('     "http://localhost:8000/api/medical/patients/"');
}

// Run the tests
main().catch(console.error);