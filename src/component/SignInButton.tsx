import { Button } from "@/component/ui/button";
import { authClient } from "@/lib/auth/client";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const SignInButton = () => {
    const login = async () => {
        await authClient.signIn.social({ provider: "google", callbackURL: `/reading` });
    };

    return (
        <Button onClick={login}>
            <FontAwesomeIcon icon={faRightToBracket} className="icon mr-3" />
            <p>Sign In</p>
        </Button>
    );
};

export default SignInButton;
