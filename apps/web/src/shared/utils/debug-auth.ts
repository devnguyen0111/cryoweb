/**
 * Debug utility for authentication issues
 */

import { api } from '../lib/api'

export async function testRegisterAPI() {
    console.log('🔍 Testing Register API...')

    try {
        const testData = {
            fullName: 'Test User',
            email: 'test@example.com',
            phone: '1234567890',
            password: 'testpassword123',
        }

        console.log('Sending register request with data:', testData)

        const response = await api.auth.register(testData)

        console.log('✅ Register API Response:', response)
        console.log('✅ User data:', response.data?.user)
        console.log('✅ User role:', response.data?.user?.roleName)
        console.log('✅ User role type:', typeof response.data?.user?.roleName)
        console.log('✅ Email verified:', response.data?.emailVerified)
        console.log('✅ Requires verification:', response.requiresVerification)

        return response
    } catch (error) {
        console.error('❌ Register API Error:', error)
        throw error
    }
}

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

// Test function to run in browser console
export function runAuthTests() {
    console.log('🚀 Running Authentication Tests...')

    // Test register
    testRegisterAPI()
        .then(() => {
            console.log('✅ Register test completed')
            // Test login after register
            return testLoginAPI()
        })
        .then(() => {
            console.log('✅ Login test completed')
            console.log('🎉 All auth tests completed successfully!')
        })
        .catch(error => {
            console.error('❌ Auth tests failed:', error)
        })
}

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
    ;(window as any).testAuth = {
        register: testRegisterAPI,
        login: testLoginAPI,
        runAll: runAuthTests,
    }

    console.log('🔧 Auth test utilities available in window.testAuth')
    console.log('Usage: window.testAuth.runAll()')
}
