import { DefaultSession, User as DefaultUser } from "next-auth";

declare module "next-auth" {
    interface User extends DefaultUser {
        id: string;
        access_token: string;
        refresh_token: string;
        id_token: string;
    }

    interface Session extends DefaultSession {
        user: User;
    }
}
