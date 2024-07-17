

import Image from "next/image";

export default function GearDisplay({ gear }) {
    return (
        <div className="mt-8">
            {gear.map((player) => (
                <div key={player.username} className="flex flex-col">
                    <h2 className="text-md">{player.username}</h2>
                    <div className="flex gap-2">
                        {player.equipment.map((item, index) => (
                            <Image key={index} src={item.icon} alt={item.name} width={75} height={75} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}