import React, {useState, useRef, useEffect} from 'react'
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import ACTIONS from '../Actions';
import toast from 'react-hot-toast';
import {useLocation, useNavigate, Navigate, useParams} from 'react-router-dom';

const EditorPage = () => {

    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location=useLocation();
    const {roomId}=useParams();
    const reactNavigator=useNavigate();
    const [clients,setClients] = useState([]);
    

    useEffect(() => {
        const handleErrors = (err) => {
            console.log('Socket error:', err);
            toast.error("Socket connection failed, try again later.");
            reactNavigator('/');
        };
        
        const init = async () => {
            
                socketRef.current = await initSocket();
                socketRef.current.onerror = handleErrors;

                const username = location.state?.userName;
                if (!username) {
                    console.error("Username is missing in location state.");
                    toast.error("Username is missing. Please enter a valid username.");
                   
                    return;
                }

            
                const joinMessage = JSON.stringify({
                    type: ACTIONS.JOIN,
                    roomId,
                    username,
                    
                });
                socketRef.current.send(joinMessage);   



                    const handleMessage = (event) => {
                    const { data } = event;
                    const { type, clients, username, socketId, code } = JSON.parse(data);

                    switch (type) {
                        case ACTIONS.JOINED:
                            if (username !== location.state?.userName) {
                                toast.success(`${username} joined the room.`);
                            }
                            console.log(`${username} joined`);
                            
                            setClients(clients);
                            codeRef.current = code || "";
                            const syncCodeMessage = JSON.stringify({
                                type: ACTIONS.SYNC_CODE,
                                socketId,
                                code: codeRef.current
                            });
                            socketRef.current.send(syncCodeMessage);

                           
                            break;

                        case ACTIONS.DISCONNECTED:
                            if (username !== location.state?.userName) {
                                toast.success(`${username} left the room.`);
                            }
                            setClients((prev) => prev.filter((client) => client.socketId !== socketId));
                            break;
                       
                        default:
                            console.log('Unknown action type:', type);
                    }
                };


                socketRef.current.addEventListener('message', handleMessage); 
                return () => {
                    socketRef.current.removeEventListener('message', handleMessage);
                    socketRef.current.close();
                };
        };

        init();
        
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {
        const username = location.state?.userName;

        if (socketRef.current) {
            const leaveMessage = JSON.stringify({
                type: ACTIONS.LEAVE,
                roomId,
                username,
            });
            socketRef.current.send(leaveMessage);
        }
        reactNavigator('/');
    }


    if (!location.state){
        return <Navigate to="/"/>;
    }
  return (
    <div className='mainWrap'>
        <div className='aside'>
         <div className='asideInner'>
            <div className='logo'>
                <img className = 'logoImage' src="/COLLAB.png" alt="logo" width={235} height={100}/>
            </div>
            <h3>Connected</h3>
            <div className='clientList'>

                {
                    clients.map((client)=>(
                        <Client key={client.socketId} username={client.username}/>
                    )
                )
                }
            </div>
         </div>
         <button className='btn copyBtn' onClick={copyRoomId}>Copy ROOM ID</button>
         <button className='btn leaveBtn' onClick={leaveRoom}>Leave</button>
        </div>
        <div className='editorWrap'>
            <Editor 
            socketRef={socketRef} 
            roomId={roomId} 
            onCodeChange={(code) => {codeRef.current = code;}}/>
        </div>
    </div>
  )
}

export default EditorPage