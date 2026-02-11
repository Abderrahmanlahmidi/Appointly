import { auth, signOut } from "@/lib/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-6">Home Page</h1>

      {session ? (
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center gap-4 border">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Welcome, {session.user?.name || "User"}!</h2>
            <p className="text-gray-500">{session.user?.email}</p>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded transition-colors"
            >
              Logout
            </button>
          </form>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
          <Link
            href="/login"
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded transition-colors"
          >
            Go to Login
          </Link>
        </div>
      )}
    </div>
  );
}
