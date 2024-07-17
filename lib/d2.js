"use server";

const ROOT_URL = "https://www.bungie.net/Platform";
const ASSETS_URL = "https://www.bungie.net";

export async function getFireteamGear(bungieName) {
    // Split name
    const [displayName, code] = bungieName.split("#");
    try {
        // Get the player.
        const player = await searchPlayer(displayName, code);
        if (player["Response"].length === 0) {
            throw new Error("Player not found.");
        }

        // Grab the membership ID and type.
        const membershipId = player["Response"][0]["membershipId"];
        const membershipType = player["Response"][0]["membershipType"];

        // Get the player's fireteam.
        const fireteam = await getFireteam(membershipId, membershipType);
    
        // Get the gear of each player in the fireteam.
        const fireteamInfo = await getFireteamInfo(fireteam);
        return fireteamInfo;
    } catch (error) {
        console.error(error.message);
    }    
}

// Search for a player by their display name and code.
async function searchPlayer(displayName, displayNameCode) {
    const url = `${ROOT_URL}/Destiny2/SearchDestinyPlayerByBungieName/-1/`;
    const headers = new Headers();
    headers.append("X-API-Key", process.env.API_KEY);
    const body = JSON.stringify({ displayName, displayNameCode });
    const response = await fetch(url, { method: "POST", headers, body });
    const data = await response.json();
    if (response.status !== 200) {
        throw new Error("Failed to search player.");
    }
    return data;
}

// General method to get a player's profile.
async function getProfile(membershipId, membershipType, components) {
    const url = `${ROOT_URL}/Destiny2/${membershipType}/Profile/${membershipId}/?components=${components.join(",")}`;
    const headers = new Headers();
    headers.append("X-API-Key", process.env.API_KEY);
    const response = await fetch(url, { headers });
    const data = await response.json();
    if (response.status !== 200) {
        throw new Error("Failed to get profile.");
    }
    return data;
}

async function getFireteam(membershipId, membershipType) {
    const profile = await getProfile(membershipId, membershipType, ["1000"]);
    const fireteam = profile["Response"]["profileTransitoryData"]["data"]["partyMembers"];
    if (fireteam == undefined || fireteam.length == 0) {
        throw new Error("No fireteam could be found.");
    }

    const trimmedFireteam = [];

    for (const player of fireteam) {
        const membershipId = player["membershipId"];
        const membershipType = await getMembershipType(membershipId);
        trimmedFireteam.push({
            membershipId,
            membershipType
        });
    }
    return trimmedFireteam;
}

async function getMembershipType(membershipId) {
    const url = `${ROOT_URL}/Destiny2/-1/Profile/${membershipId}/LinkedProfiles/?getAllMemberships=true`;
    const headers = new Headers();
    headers.append("X-API-Key", process.env.API_KEY);
    const response = await fetch(url, { headers });
    if (response.status !== 200) {
        throw new Error("Failed to get membership type.");
    }
    const data = await response.json();
    return data["Response"]["profiles"][0]["membershipType"];
}

async function getFireteamInfo(fireteam) {
    const info = [];
    const manifest = await getManifest();
    const LID = await getLiteItemDefinition(manifest);
    for (const player of fireteam) {
        const profile = await getProfile(player["membershipId"], player["membershipType"], ["100, 200, 205"]);
 
        const characters = profile["Response"]["characters"]["data"];
        const characterId = getMostRecentCharacterId(characters);

        const equipment = profile["Response"]["characterEquipment"]["data"][characterId]["items"];
        const parsedEquipment = parseEquipment(equipment, LID);

        const username = profile["Response"]["profile"]["data"]["userInfo"]["displayName"]; // THIS MIGHT HAVE TO BE -> bungieGlobalDisplayName
        info.push({
            username,
            "equipment": parsedEquipment
        })
    }
    return info;
}

function getMostRecentCharacterId(characters) {
    const timePlayedMap = {};
        for (const character in characters) {
            timePlayedMap[character] = characters[character]["dateLastPlayed"];
        }
    const mostRecent = getMostRecentTime(timePlayedMap);
    return getMostRecentTime(timePlayedMap);
}

function getMostRecentTime(timePlayedMap) {
    return Object.entries(timePlayedMap).reduce((max, [key, value]) => {
        return (max === null || new Date(value) > new Date(timePlayedMap[max])) ? key : max;
    }, null);
}

async function getManifest() {
    const url = `${ROOT_URL}/Destiny2/Manifest/`;
    const headers = new Headers();
    headers.append("X-API-Key", process.env.API_KEY);
    const response = await fetch(url, { headers });
    if (response.status !== 200) {
        throw new Error("Failed to get manifest.");
    }
    const data = await response.json();
    return data;
}

async function getLiteItemDefinition(manifest) {
    const item_def = manifest["Response"]["jsonWorldComponentContentPaths"]["en"]["DestinyInventoryItemLiteDefinition"]
    const url = `${ASSETS_URL}${item_def}`;
    const response = await fetch(url);
    if (response.status !== 200) {
        throw new Error("Failed to get item definition.");
    }
    const data = await response.json();
    return data;
}

function parseEquipment(equipment, LID) {
    const parsed = [];
    const allowedBuckets = [3448274439, 3551918588, 14239492, 20886954, 1585787867, 4023194814];
    for (const item of equipment) {
        if (allowedBuckets.includes(item["bucketHash"])) {
            let itemDef = LID[item["itemHash"]];
            if (item.hasOwnProperty("overrideStyleItemHash")) {
                itemDef = LID[item["overrideStyleItemHash"]];    
            }
            parsed.push({
                name: itemDef["displayProperties"]["name"],
                icon: `${ASSETS_URL}${itemDef["displayProperties"]["icon"]}`
            });
        }
    }

    return parsed;
}