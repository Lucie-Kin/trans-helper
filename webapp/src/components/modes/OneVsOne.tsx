/*
}*/
import { useState, useEffect } from "react";
import { getSocket, connectSocket } from "../../socket";
import "../../style/tournament/versus.css";

export default function VersusBox() {
    const socket = getSocket();
    
    useEffect(() => {
        const s = getSocket();
    }, []);
    return (
        <div className="vs-box">
            <div className="leftBox">
            </div>
        </div>
    )
}
