export {};

declare module 'simple-google-openid' {
    /** simple-google-openid Profile */
    interface GoogleProfile {
        displayName: string;
        name: GoogleProfile.Name;
        emails: GoogleProfile.Email[];
        photos: GoogleProfile.Photo[];
        id: string;
        provider: string;
    }

    namespace GoogleProfile  {
        interface Name {
            familyName: string;
            givenName: string;
        }
        
        interface Email {
            value: string;
            verified: boolean;
        }
        
        interface Photo {
            value: string;
        }
    }
}
