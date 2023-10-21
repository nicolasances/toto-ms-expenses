import { CustomAuthVerifier } from "./controller/model/CustomAuthVerifier";
import { TotoControllerConfig } from "./controller/model/TotoControllerConfig";
import { ValidatorProps } from "./controller/model/ValidatorProps";
import { TotoAuthProvider } from "./totoauth/TotoAuthProvider";

export class ControllerConfig implements TotoControllerConfig {

    async load(): Promise<any> {
        
    }

    getCustomAuthVerifier(): CustomAuthVerifier {

        return new TotoAuthProvider("https://toto-ms-auth-6lv62poq7a-ew.a.run.app")
    }

    getProps(): ValidatorProps {
        
        return {}
    }

}