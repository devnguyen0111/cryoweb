/**
 * API Test Utility
 * Use this to test API connection and endpoints
 */

import { api } from '../lib/api'

export async function testApiConnection() {
    console.log('🔍 Testing API connection...')

    try {
        // Test basic connectivity
        const response = await fetch('https://cryofert.runasp.net/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'testpassword',
            }),
        })

        console.log('✅ API is reachable')
        console.log('Status:', response.status)
        console.log('Headers:', Object.fromEntries(response.headers.entries()))

        if (response.status === 400 || response.status === 401) {
            console.log('✅ API is responding correctly (expected auth error)')
        }

        return true
    } catch (error) {
        console.error('❌ API connection failed:', error)
        return false
    }
}

export async function testAuthEndpoints() {
    console.log('🔍 Testing Auth endpoints...')

    const endpoints = [
        '/auth/login',
        '/auth/register',
        '/auth/logout',
        '/auth/refresh-token',
        '/auth/forgot-password',
        '/auth/change-password',
        '/auth/verify-email',
        '/auth/send-verification-email',
    ]

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`https://cryofert.runasp.net/api${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            })

            console.log(`✅ ${endpoint}: ${response.status}`)
        } catch (error) {
            console.error(`❌ ${endpoint}:`, error)
        }
    }
}

export async function testUserEndpoints() {
    console.log('🔍 Testing User endpoints...')

    const endpoints = ['/user/profile', '/user', '/user/search', '/user/email-exists']

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`https://cryofert.runasp.net/api${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            console.log(`✅ ${endpoint}: ${response.status}`)
        } catch (error) {
            console.error(`❌ ${endpoint}:`, error)
        }
    }
}

// Run tests when imported
if (typeof window !== 'undefined') {
    // Only run in browser environment
    setTimeout(() => {
        console.log('🚀 Running API tests...')
        testApiConnection()
            .then(() => testAuthEndpoints())
            .then(() => testUserEndpoints())
            .then(() => console.log('✅ All API tests completed'))
            .catch(error => console.error('❌ API tests failed:', error))
    }, 2000)
}
