/**
 * Debug utility for authentication issues
 */

import { api } from '../lib/api'

export async function testLoginAPI() {
    console.log('🔍 Testing Login API...')

    try {
        const testData = {
            email: 'test@example.com',
            password: 'testpassword123',
        }

        console.log('Sending login request with data:', testData)

        const response = await api.auth.login(testData)

        console.log('✅ Login API Response:', response)
        console.log('✅ User data:', response.data?.user)
        console.log('✅ User role:', response.data?.user?.roleName)
        console.log('✅ User role type:', typeof response.data?.user?.roleName)
        console.log('✅ Email verified:', response.data?.emailVerified)
        console.log('✅ Requires verification:', response.requiresVerification)
        console.log('✅ Is banned:', response.isBanned)

        return response
    } catch (error) {
        console.error('❌ Login API Error:', error)
        throw error
    }
}

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
    ;(window as any).testAuth = {
        login: testLoginAPI,
    }

    console.log('🔧 Auth test utilities available in window.testAuth')
    console.log('Usage: window.testAuth.login()')
}
