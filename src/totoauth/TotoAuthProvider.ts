import { AuthCheckResult, CustomAuthVerifier, IdToken } from "../controller/model/CustomAuthVerifier";

const { verifyToken } = require('./api/AuthAPI');

export class TotoAuthProvider implements CustomAuthVerifier {

    authAPIEndpoint: string;

    constructor(authAPIEndpoint: string) {
        this.authAPIEndpoint = authAPIEndpoint;
    }

    async verifyIdToken(idToken: IdToken): Promise<AuthCheckResult> {

        console.log("Validating custom token");

        const result = await verifyToken(this.authAPIEndpoint, idToken.idToken, null)

        if (!result || result.code == 400) throw result;

        console.log("Custom token successfully validated");

        return {
            sub: result.sub,
            email: result.email,
            authProvider: result.authProvider
        }

    }
}
