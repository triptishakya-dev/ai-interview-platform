"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const Navbar = () => {
  const [user, setUser] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/cookies");
        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setUser(data);
        }
      } catch (error) {
        console.log("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  const handleLogOut = async () => {
    try {
      const res = await fetch("/api/auth/log-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        console.log("User logged out successfully");
        window.location.reload(); // ✅ this reloads the page
      } else {
        const data = await res.json();
        console.error("Logout failed:", data.msg || "Unknown error");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <nav className="">
      <div className="flex flex-row justify-between items-center blue-gradient-dark rounded-full p-4 w-full px-10 max-w-[1200px] mx-auto">
        <Link href={"/"} className="flex items-center gap-2">
          <Image src={"/logo.svg"} height={32} width={38} alt="Logo" />
        <h2 className="text-primary-100">Prepwise</h2>
        </Link>
        <div className="flex gap-5">
        {user?.id ? (
            <button
              className="btn-primary"
              onClick={handleLogOut}
            >
              Log Out
            </button>
          ) : (
            <Link href={"/sign-in"}>
              <button className="btn-primary">
                Sign In
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;