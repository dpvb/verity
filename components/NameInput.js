"use client";

import { useState } from "react";

export default function NameInput({ onSubmit, submitText }) {
    const [name, setName] = useState("");
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!name.includes("#")) {
            return;
        }
        onSubmit(name);
    }

    return (
        <div className="flex flex-col items-center pt-8">
            <form className="flex" onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    placeholder="Enter your BungieName#Code" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="bg-slate-800 w-64 rounded-l-lg p-2 outline-none" 
                />
                <button className="bg-blue-600 px-2 rounded-r-lg hover:bg-blue-700 transition-all duration-200 ease-in-out">{ submitText }</button>
            </form>
        </div>
    );
}