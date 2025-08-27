import { Button } from "@/component/ui/button";
import { signInWithGoogle } from "@/server/old/repo/user";
import { LuLogIn } from "lucide-react";

const SignInButton = () => {
    return (
        <Button onClick={async () => await signInWithGoogle()}>
            <LuLogIn className="icon mr-3" />
            <p>Sign In</p>
        </Button>
    );
};

export default SignInButton;
