
export interface ValidatorProps {

    /**
     * If this property is set to true, authentication (through the Authorization header) is not necessary
     * Default is false
     */
    noAuth?: boolean, 

    /**
     * If this property is set to true, the x-correlation-id header is not needed
     * Default is false
     */
    noCorrelationId?: boolean,

    /**
     * This property allows the backend to configure the min app version needed from the client in order to be supported
     * Default is null
     */
    minAppVersion?: string


}