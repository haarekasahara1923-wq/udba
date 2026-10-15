'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
    id: string
    name: string
    email: string
    role: string
    tenantId: string
    phone?: string
    studentId?: string
}

interface Tenant {
    id: string
    name: string
    logo?: string
    themeColor: string
    phone?: string
    email?: string
    address?: string
    website?: string
    schoolCode?: string
    diseCode?: string
}

interface Subscription {
    plan: string
    status: string
    trialEndsAt?: string
    amount?: number
}

interface AuthContextType {
    user: User | null
    tenant: Tenant | null
    subscription: Subscription | null
    token: string | null
    login: (email: string, password: string, role?: string, tenantId?: string) => Promise<{ success: boolean; error?: string }>
    logout: () => void
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // If logout=1 is present in URL, explicitly purge everything and do not restore user
        if (typeof window !== 'undefined' && window.location.search.includes('logout=1')) {
            try {
                localStorage.clear()
                sessionStorage.clear()
            } catch (e) {}
            setUser(null)
            setTenant(null)
            setSubscription(null)
            setToken(null)
            setIsLoading(false)
            try {
                window.history.replaceState({}, document.title, window.location.pathname)
            } catch (e) {}
            return
        }

        const storedToken = localStorage.getItem('UDA_token') || localStorage.getItem('udba_token')
        const storedUser = localStorage.getItem('UDA_user') || localStorage.getItem('udba_user')
        const storedTenant = localStorage.getItem('UDA_tenant') || localStorage.getItem('udba_tenant')
        const storedSub = localStorage.getItem('UDA_subscription') || localStorage.getItem('udba_subscription')

        if (storedToken && storedUser) {
            try {
                setToken(storedToken)
                setUser(JSON.parse(storedUser))
                if (storedTenant) setTenant(JSON.parse(storedTenant))
                if (storedSub) setSubscription(JSON.parse(storedSub))
            } catch (e) {
                console.error('Error parsing stored user data:', e)
                setUser(null)
                setToken(null)
            }
        }
        setIsLoading(false)
    }, [])

    const login = async (email: string, password: string, role?: string, tenantId?: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role, tenantId }),
            })
            const data = await res.json()

            if (!data.success) {
                return { success: false, error: data.error || 'Login failed' }
            }

            setToken(data.accessToken)
            setUser(data.user)
            setTenant(data.tenant)
            setSubscription(data.subscription)

            localStorage.setItem('UDA_token', data.accessToken)
            localStorage.setItem('UDA_user', JSON.stringify(data.user))
            localStorage.setItem('UDA_tenant', JSON.stringify(data.tenant))
            localStorage.setItem('UDA_subscription', JSON.stringify(data.subscription))
            localStorage.setItem('UDA_refresh', data.refreshToken)

            return { success: true }
        } catch {
            return { success: false, error: 'Network error' }
        }
    }

    const logout = () => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.clear()
                sessionStorage.clear()
            }
        } catch (e) {
            console.error('Logout error:', e)
        }
        setUser(null)
        setTenant(null)
        setSubscription(null)
        setToken(null)
        if (typeof window !== 'undefined') {
            window.location.href = '/login?logout=1'
        }
    }

    return (
        <AuthContext.Provider value={{ user, tenant, subscription, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}

export function useApi() {
    const { token } = useAuth()

    const fetcher = async (url: string, options?: RequestInit) => {
        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options?.headers,
            },
        })
        return res.json()
    }

    return { fetcher }
}
