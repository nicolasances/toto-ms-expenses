import { CustomAuthVerifier } from "./CustomAuthVerifier";
import { ValidatorProps } from "./ValidatorProps";

export interface TotoControllerConfig {

    /**
     * Loads the configurations and returns a Promise when done
     */
    load(): Promise<any>,

    /**
     * Returns a CustomAuthVerifier, if any
     */
    getCustomAuthVerifier(): CustomAuthVerifier,

    /**
     * Returns the Validator Properties
     */
    getProps(): ValidatorProps

}