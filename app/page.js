"use client";

import GearDisplay from "@/components/GearDisplay";
import NameInput from "@/components/NameInput";
import { getFireteamGear } from "@/lib/d2";
import { useState } from "react";
import { Suspense } from "react";

export default function Home() {

  const [gear, setGear] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (name) => {
    setLoading(true);
    const g = await getFireteamGear(name);
    setGear(g);
    setLoading(false);
  }

  return (
    <main className="bg-slate-900 min-h-screen flex flex-col items-center">
        <NameInput onSubmit={(name) => handleSubmit(name)} submitText={loading ? "Loading..." : "Search"}/>
        { gear && <GearDisplay gear={gear}/> }
    </main>
  );
}
