import { Logger } from "../../logger/TotoLogger";

const { OAuth2Client } = require('google-auth-library');

const decodeJWT = (token: string | null) => {
    if (token !== null || token !== undefined) {
        const base64String = token!.split(`.`)[1];
        const decodedValue = JSON.parse(Buffer.from(base64String, `base64`).toString(`ascii`));
        return decodedValue;
    }
    return null;
}

export async function googleAuthCheck(cid: string, authorizationHeader: string | string[] | undefined, clientID: string, logger: Logger) {

    const token: string | null = authorizationHeader ? String(authorizationHeader).substring('Bearer'.length + 1) : null;

    const client = new OAuth2Client(clientID);

    const decodedToken = decodeJWT(token)

    // Useful for debugging audience-related issues
    if (decodedToken.aud != clientID) {
        logger.compute(cid, `Payload Audience: ${decodedToken.aud}`, "error");
        logger.compute(cid, `Target Audience: ${clientID}`, "error");
    }

    const ticket = await client.verifyIdToken({ idToken: token, audience: clientID })

    let payload = ticket.getPayload();

    return {
        userId: payload.sub,
        email: payload.email,
        authProvider: 'google'
    }

}