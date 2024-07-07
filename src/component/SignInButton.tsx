"use client";

import { Button } from "@/component/ui/button";
import { signInWithGoogle } from "@/server/action/user";
import { LuLogIn } from "react-icons/lu";

const SignInButton = () => {
    return (
        <Button onClick={async () => await signInWithGoogle()}>
            <LuLogIn className="icon mr-3" />
            <p>Sign In</p>
        </Button>
    );
};

export default SignInButton;
