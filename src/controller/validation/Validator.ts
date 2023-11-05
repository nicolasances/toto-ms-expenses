
import { ValidatorProps } from "../model/ValidatorProps";
import { Logger } from "../../logger/TotoLogger";
import { CustomAuthVerifier } from "../model/CustomAuthVerifier";
import { Request } from "express";
import { customAuthCheck } from "./CustomAuthCheck";
import { UserContext } from "../model/UserContext";
import { googleAuthCheck } from "./GoogleAuthCheck";

const decodeJWT = (authorizationHeader: string) => {

  const token = String(authorizationHeader).substring('Bearer'.length + 1);

  if (token !== null || token !== undefined) {
      const base64String = token.split(`.`)[1];
      const decodedValue = JSON.parse(Buffer.from(base64String, `base64`).toString(`ascii`));
      return decodedValue;
  }
  return null;
}

const getAuthProvider = (tokenJson: any) => {

  if (tokenJson.authProvider) return tokenJson.authProvider;

  if (tokenJson.iss && tokenJson.iss == "https://accounts.google.com") return "google";

  return "custom";

}

/**
 * Base Validator for HTTP Requests 
 */
export class Validator {

  props: ValidatorProps;
  logger: Logger;
  customAuthVerifier?: CustomAuthVerifier;

  /**
   * 
   * @param {object} props Propertiess
   * @param {object} logger the toto logger
   * @param {object} customAuthVerifier a custom auth verifier
   */
  constructor(props: ValidatorProps, logger: Logger, customAuthVerifier?: CustomAuthVerifier) {
    this.props = props;
    this.logger = logger;
    this.customAuthVerifier = customAuthVerifier;
  }

  /**
   * Validates the provided request
   * @param req Request the Express request
   * @returns a Promise
   */
  async validate(req: Request): Promise<UserContext | undefined> {

    // Extraction of the headers
    // Authorization & AuthProvider
    let authorizationHeader = req.headers['authorization'] ?? req.headers['Authorization'];
    let clientID = req.headers['x-client-id'];

    // Correlation ID 
    let cid: string = String(req.headers['x-correlation-id']) ?? "";

    // App Version
    let appVersion = req.headers['x-app-version'];

    // Checking Correlation ID
    if (this.props.noCorrelationId == null || this.props.noCorrelationId == false) {

      if (cid == null) throw new ValidationError(400, "No Correlation ID was provided")

    }

    // Checking minimum app version
    // The minimum app version must be in the format major.minor.patch
    if (this.props.minAppVersion) {

      if (appVersion && appVersion < this.props.minAppVersion) throw new ValidationError(412, "The App Version is not compatible with this API", 'app-version-not-compatible')
    }

    // Checking authorization
    // If the config doesn't say to bypass authorization, look for the Auth header
    if (this.props.noAuth == null || this.props.noAuth == false) {

      if (!authorizationHeader) throw new ValidationError(401, "No Authorization Header provided")

      // Decode the JWT token
      const decodedToken = decodeJWT(String(authorizationHeader))

      // Retrieve the auth provider from the JWT Token
      const authProvider = getAuthProvider(decodedToken);

      if (authProvider == "custom" && this.customAuthVerifier) return await customAuthCheck(cid, authorizationHeader, this.customAuthVerifier, this.logger);
      else if (authProvider == 'google') return await googleAuthCheck(cid, authorizationHeader, String(clientID), this.logger)

    }

  }
}

export class ValidationError extends Error {

  code: number;
  message: string;
  subcode: string | undefined;

  constructor(code: number, message: string, subcode?: string) {
    super()

    this.code = code;
    this.message = message;
    this.subcode = subcode;
  }
}

export class LazyValidator extends Validator {

  constructor() {
    super({}, new Logger(""));
  }

}
