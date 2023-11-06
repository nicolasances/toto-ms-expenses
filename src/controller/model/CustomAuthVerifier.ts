
export interface CustomAuthVerifier {

    /**
     * Provides an identifier of the auth provider. 
     * This will be used as the Custom Auth Verifier will be used only when tokens with "authProvider" field 
     * that match this function's returned value are provided
     */
    getAuthProvider(): string

    verifyIdToken(idToken: IdToken): Promise<AuthCheckResult>

}

export interface IdToken {

    idToken: string

}

export interface AuthCheckResult {

    sub: string,
    email: string,
    authProvider: string

}