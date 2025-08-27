import { Button } from "@/component/ui/button";
import { authClient } from "@/lib/auth/client";
import { LogIn } from "lucide-react";

const SignInButton = () => {
    const login = async () => {
        await authClient.signIn.social({ provider: "google", callbackURL: `/create` });
    };

    return (
        <Button onClick={login}>
            <LogIn className="icon mr-3" />
            <p>Sign In</p>
        </Button>
    );
};

export default SignInButton;
