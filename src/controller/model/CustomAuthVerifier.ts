
export interface CustomAuthVerifier {

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