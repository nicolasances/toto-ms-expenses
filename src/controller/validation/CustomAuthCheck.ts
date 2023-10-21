import { Logger } from "../../logger/TotoLogger";
import { CustomAuthVerifier } from "../model/CustomAuthVerifier";
import { UserContext } from "../model/UserContext";

/**
 * This function allows extensions on the Toto authorization validator, by supporting custom authProvider and custom ways to verify authorization
 * @param {string} cid correlation id
 * @param {string} authorizationHeader Authorization HTTP header
 * @param {object} authorizationVerifier authorization verifier. It's an object that must have a function called verifyIdToken()
 * @param {object} logger the toto logger to use
 * @returns 
 */
export async function customAuthCheck(cid: string | string[] | undefined, authorizationHeader: string | string[] | undefined, authorizationVerifier: CustomAuthVerifier, logger: Logger): Promise<UserContext> {

    let token = String(authorizationHeader).substring('Bearer'.length + 1);

    try {

        const result = await authorizationVerifier.verifyIdToken({ idToken: token });

        return {
            userId: result.sub,
            email: result.email,
            authProvider: result.authProvider
        }

    } catch (error) {

        logger.compute(cid, "Invalid Authorization Token", "error")

        throw { code: 401, message: `Invalid Authorization Token [${token}]` }

    }
}

