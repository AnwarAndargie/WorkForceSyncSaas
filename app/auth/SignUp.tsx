import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function SignUp() {
  const { signUp } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = () => {
    signUp(username, password);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-2xl mb-4">Sign Up</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="mb-2 p-2 border"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-2 p-2 border"
      />
      <button
        onClick={handleSignUp}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Sign Up
      </button>
    </div>
  );
}
