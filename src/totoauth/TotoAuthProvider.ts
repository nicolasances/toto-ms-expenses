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

        console.log(result);

        if (!result || result.code == 400) throw result;
        if (result && result.name == 'JsonWebTokenError') throw {code: 400, message: result.message}

        console.log("Custom token successfully validated");

        return {
            sub: result.sub,
            email: result.email,
            authProvider: result.authProvider
        }

    }
}
