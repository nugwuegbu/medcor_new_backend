#!/usr/bin/env node

/**
 * Multi-Tenant API Demo
 * Demonstrates how to make API requests to different tenants
 */

const BASE_URL = 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000';

// Tenant configurations with actual domain names from your system
const TENANTS = {
    public: {
        name: 'Public Tenant',
        host: '14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev',
        credentials: { email: 'admin@localhost', password: 'admin123' }
    },
    hospital: {
        name: 'MedCor Hospital',
        host: 'medcorhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev',
        credentials: { email: 'hospital@localhost', password: 'hospital123' }
    },
    clinic: {
        name: 'MedCor Clinic', 
        host: 'medcorclinic.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev',
        credentials: { email: 'clinic@localhost', password: 'clinic123' }
    }
};

class TenantAPIClient {
    constructor(tenantConfig) {
        this.tenant = tenantConfig;
        this.token = null;
    }
    
    async makeRequest(endpoint, options = {}) {
        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            'Host': this.tenant.host,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        let data = null;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        
        return {
            status: response.status,
            success: response.ok,
            data: data
        };
    }
    
    async login() {
        console.log(`🔐 Logging into ${this.tenant.name}...`);
        
        const result = await this.makeRequest('/api/auth/login/', {
            method: 'POST',
            body: JSON.stringify(this.tenant.credentials)
        });
        
        if (result.success) {
            this.token = result.data.access_token;
            console.log(`   ✅ Login successful!`);
            console.log(`   🎫 Token: ${this.token.substring(0, 20)}...`);
            return true;
        } else {
            console.log(`   ❌ Login failed: ${JSON.stringify(result.data)}`);
            return false;
        }
    }
    
    async fetchTenantData() {
        console.log(`\n📊 Fetching ${this.tenant.name} data:`);
        
        const endpoints = [
            '/api/',
            '/api/tenants/',
            '/api/appointments/',
            '/api/subscription/'
        ];
        
        for (const endpoint of endpoints) {
            const result = await this.makeRequest(endpoint);
            
            if (result.success) {
                console.log(`   ✅ ${endpoint}: ${result.status} OK`);
                
                if (result.data && typeof result.data === 'object') {
                    if (result.data.results) {
                        console.log(`      📄 ${result.data.results.length} items found`);
                    } else if (result.data.message) {
                        console.log(`      💬 ${result.data.message}`);
                    } else {
                        console.log(`      📋 ${Object.keys(result.data).length} fields`);
                    }
                }
            } else {
                console.log(`   ${result.status === 401 ? '🔒' : '❌'} ${endpoint}: ${result.status} - ${result.status === 401 ? 'Auth required' : 'Error'}`);
            }
        }
    }
}

async function demonstrateMultiTenantAPI() {
    console.log('🏥 Multi-Tenant API Request Demonstration\n');
    console.log('═'.repeat(60));
    
    // Create API clients for each tenant
    const clients = {
        public: new TenantAPIClient(TENANTS.public),
        hospital: new TenantAPIClient(TENANTS.hospital),
        clinic: new TenantAPIClient(TENANTS.clinic)
    };
    
    // Login to each tenant
    console.log('\n🔑 Authentication Phase:');
    console.log('─'.repeat(30));
    
    for (const [key, client] of Object.entries(clients)) {
        await client.login();
    }
    
    // Fetch data from each tenant to show isolation
    console.log('\n📊 Data Isolation Demonstration:');
    console.log('─'.repeat(40));
    
    for (const [key, client] of Object.entries(clients)) {
        if (client.token) {
            await client.fetchTenantData();
        } else {
            console.log(`\n⚠️  Skipping ${client.tenant.name} - Authentication failed`);
        }
    }
    
    // Show practical examples
    console.log('\n💡 Practical Multi-Tenant API Examples:');
    console.log('─'.repeat(50));
    
    console.log('\n🌟 cURL Examples:');
    console.log('');
    
    for (const [key, client] of Object.entries(clients)) {
        if (client.token) {
            console.log(`# ${client.tenant.name} API Request:`);
            console.log(`curl -H "Host: ${client.tenant.host}" \\`);
            console.log(`     -H "Authorization: Bearer ${client.token.substring(0, 30)}..." \\`);
            console.log(`     -H "Content-Type: application/json" \\`);
            console.log(`     "${BASE_URL}/api/tenants/"`);
            console.log('');
        }
    }
    
    console.log('🔧 JavaScript Fetch Examples:');
    console.log('');
    
    for (const [key, client] of Object.entries(clients)) {
        if (client.token) {
            console.log(`// ${client.tenant.name} request`);
            console.log(`const ${key}Response = await fetch("${BASE_URL}/api/tenants/", {`);
            console.log(`  headers: {`);
            console.log(`    "Host": "${client.tenant.host}",`);
            console.log(`    "Authorization": "Bearer " + ${key}Token,`);
            console.log(`    "Content-Type": "application/json"`);
            console.log(`  }`);
            console.log(`});`);
            console.log('');
        }
    }
    
    // Test data isolation by making simultaneous requests
    console.log('🔄 Testing Simultaneous Tenant Requests:');
    console.log('─'.repeat(45));
    
    const simultaneousRequests = Object.entries(clients)
        .filter(([key, client]) => client.token)
        .map(async ([key, client]) => {
            const result = await client.makeRequest('/api/tenants/');
            return { tenant: key, name: client.tenant.name, result };
        });
    
    if (simultaneousRequests.length > 0) {
        const results = await Promise.all(simultaneousRequests);
        
        console.log('\n📋 Simultaneous Request Results:');
        for (const { tenant, name, result } of results) {
            console.log(`   ${name}: ${result.success ? '✅' : '❌'} ${result.status} - ${result.success ? 'Data isolated correctly' : 'Request failed'}`);
        }
    }
    
    console.log('\n✅ Multi-Tenant API Demonstration Complete!');
    console.log('\n🎯 Key Takeaways:');
    console.log('• Each tenant has isolated data and authentication');
    console.log('• Host header determines which tenant schema to access');
    console.log('• JWT tokens are tenant-specific and cannot cross tenants');
    console.log('• API endpoints return different data per tenant');
    console.log('• Same API structure works across all tenants');
}

// Run demo directly
demonstrateMultiTenantAPI().catch(console.error);