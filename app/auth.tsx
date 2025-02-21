import React, { useState } from 'react';
import SignIn from '../components/auth/SignIn';
import SignUp from '../components/auth/SignUp';
import AuthLayout from '../components/auth/AuthLayout';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <AuthLayout>
      {isSignUp ? (
        <SignUp onSignInPress={() => setIsSignUp(false)} />
      ) : (
        <SignIn onSignUpPress={() => setIsSignUp(true)} />
      )}
    </AuthLayout>
  );
}
