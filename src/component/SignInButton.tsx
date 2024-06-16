"use client";

import { Button } from "@/component/ui/button";
import { signInWithGoogle } from "@/server/action/user";

const SignInButton = () => {
    return <Button onClick={async () => await signInWithGoogle()}>Continue</Button>;
};

export default SignInButton;
