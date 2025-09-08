import Navbar from "@/components/shared/Navbar";
import Image from "next/image";
import Link from "next/link";
import React, { ReactNode } from "react";

const HomeLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="root-layout">
      <Navbar/>
      {children}
    </div>
  );
};

export default HomeLayout;