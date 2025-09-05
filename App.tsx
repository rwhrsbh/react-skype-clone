
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Message, CallState } from './types';
import { CallStatus } from './types';
import { WS_URL, RTC_CONFIGURATION } from './constants';
import ContactItem from './components/ContactItem';
import ChatWindow from './components/ChatWindow';
import CallView from './components/CallView';
import { PhoneIcon } from './components/icons';
import { incomingCall, outgoingCall, sendMessageSound, receiveMessageSound, hangUpSound, cancelledCallSound, beepDuringDialingSound, launchSound } from './sounds';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedContact, setSelectedContact] = useState<User | null>(null);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    const [callState, setCallState] = useState<CallState>({ status: CallStatus.IDLE, with: null, localStream: null, remoteStream: null });
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user');
    const [canFlipCamera, setCanFlipCamera] = useState(false);

    const ws = useRef<WebSocket | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    // Ref to hold the current username to solve stale closure issues in WebSocket callbacks
    const currentUserRef = useRef<User | null>(null);
    currentUserRef.current = currentUser;

    const cleanupConnection = useCallback(() => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (callState.localStream) {
            callState.localStream.getTracks().forEach(track => track.stop());
        }
        setCallState({ status: CallStatus.IDLE, with: null, localStream: null, remoteStream: null });
    }, [callState.localStream]);

    const sendMessage = useCallback((type: string, payload: object) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type, payload }));
        }
    }, []);

    useEffect(() => {
        // This effect runs once on mount to establish the WebSocket connection.
        const connect = () => {
            const socket = new WebSocket(WS_URL);
            ws.current = socket;

            socket.onopen = () => console.log('[CLIENT LOG] WebSocket connection opened.');
            socket.onclose = () => console.log('[CLIENT LOG] WebSocket connection closed.');
            socket.onerror = (err) => console.error("[CLIENT LOG] WebSocket error:", err);

            socket.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                const { type, payload } = data;

                switch (type) {
                    case 'login-success':
                        setCurrentUser({ username: payload.username });
                        launchSound.play();
                        break;
                    case 'login-error':
                    case 'register-error':
                        alert(`Error: ${payload.message}`);
                        break;
                    case 'register-success':
                        alert(payload.message);
                        break;
                    case 'chat-history':
                        // The payload is an object where keys are conversationKeys
                        // and values are message arrays.
                        const newMessages: Record<string, Message[]> = {};
                        for (const key in payload.history) {
                            const usernames = key.split('--');
                            // Find the other user in the conversation
                            const otherUser = usernames.find(u => u !== currentUserRef.current?.username);
                            if (otherUser) {
                                newMessages[otherUser] = payload.history[key];
                            }
                        }
                        setMessages(prev => ({ ...prev, ...newMessages }));
                        break;
                    case 'update-user-list':
                        // Use the ref here to get the most up-to-date username
                        const currentUsername = currentUserRef.current?.username;
                        if (currentUsername) {
                            setUsers(payload.users.filter((u: User) => u.username !== currentUsername));
                        } else {
                            // This can happen if a user list update arrives before login-success is processed
                            setUsers(payload.users);
                        }
                        break;
                    case 'chat-message':
                        setMessages(prev => ({ ...prev, [payload.from]: [...(prev[payload.from] || []), payload] }));
                        receiveMessageSound.play();
                        if(selectedContact?.username !== payload.from){
                            setUnreadCounts(prev => ({...prev, [payload.from]: (prev[payload.from] || 0) + 1}));
                        }
                        break;
                    case 'call-offer':
                        setCallState(prev => ({ ...prev, status: CallStatus.INCOMING, with: payload.from }));
                        peerConnection.current = createPeerConnection(payload.from);
                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
                        incomingCall.loop = true;
                        incomingCall.play();
                        break;
                    case 'call-answer':
                        if (peerConnection.current) {
                            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
                            setCallState(prev => ({ ...prev, status: CallStatus.ACTIVE }));
                            outgoingCall.pause();
                            outgoingCall.currentTime = 0;
                            beepDuringDialingSound.pause();
                            beepDuringDialingSound.currentTime = 0;
                        }
                        break;
                    case 'ice-candidate':
                        if (peerConnection.current) {
                            await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
                        }
                        break;
                    case 'hang-up':
                        cleanupConnection();
                        incomingCall.pause();
                        incomingCall.currentTime = 0;
                        outgoingCall.pause();
                        outgoingCall.currentTime = 0;
                        beepDuringDialingSound.pause();
                        beepDuringDialingSound.currentTime = 0;
                        // Only play cancelled sound if the call was incoming and not answered
                        if (callState.status === CallStatus.INCOMING) {
                            cancelledCallSound.play();
                        }
                        break;
                }
            };
        };

        connect();
        
        // The cleanup function will be called when the App component unmounts
        return () => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.close();
            }
        };
    }, []); // Empty dependency array means this effect runs only once.

    useEffect(() => {
        const savedUsername = localStorage.getItem('skypeCloneUsername');
        const savedPassword = localStorage.getItem('skypeClonePassword');
        if (savedUsername && savedPassword) {
            handleAuthentication('login', savedUsername, savedPassword, true);
        }

        // Check if camera flip is supported
        const checkCameraSupport = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setCanFlipCamera(videoDevices.length > 1);
            } catch (error) {
                console.log("Camera enumeration failed:", error);
                setCanFlipCamera(false);
            }
        };

        checkCameraSupport();
    }, []);

    const handleAuthentication = (type: 'login' | 'register', username: string, password: string, rememberMe: boolean) => {
        // If the socket is not connected, wait a bit before sending.
        if (ws.current?.readyState !== WebSocket.OPEN) {
            setTimeout(() => sendMessage(type, { username, password }), 500);
        } else {
            sendMessage(type, { username, password });
        }
        if (rememberMe && type === 'login') {
            localStorage.setItem('skypeCloneUsername', username);
            localStorage.setItem('skypeClonePassword', password);
        } else if (!rememberMe && type === 'login') {
            localStorage.removeItem('skypeCloneUsername');
            localStorage.removeItem('skypeClonePassword');
        }
    };
    
    const handleLogout = () => {
        // No need to explicitly close the socket, just reset the state
        setCurrentUser(null);
        setUsers([]);
        setSelectedContact(null);
        setMessages({});
        setUnreadCounts({});
        cleanupConnection();
        localStorage.removeItem('skypeCloneUsername');
        localStorage.removeItem('skypeClonePassword');
    };

    const createPeerConnection = (contactUsername: string): RTCPeerConnection => {
        const pc = new RTCPeerConnection(RTC_CONFIGURATION);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendMessage('ice-candidate', { to: contactUsername, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            setCallState(prev => ({ ...prev, remoteStream: event.streams[0] }));
        };
        
        if (callState.localStream) {
            callState.localStream.getTracks().forEach(track => {
                pc.addTrack(track, callState.localStream!);
            });
        }
        
        return pc;
    };

    const handleInitiateCall = async () => {
        if (!selectedContact) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: currentFacingMode }, 
                audio: true 
            });
            setCallState({ status: CallStatus.CALLING, with: selectedContact.username, localStream: stream, remoteStream: null });
            
            const pc = createPeerConnection(selectedContact.username);
            peerConnection.current = pc;
            
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            sendMessage('call-offer', { to: selectedContact.username, offer });
            outgoingCall.play();
            outgoingCall.onended = () => {
                beepDuringDialingSound.loop = true;
                beepDuringDialingSound.play();
            };
        } catch (error) {
            console.error("Error starting call:", error);
        }
    };
    
    const handleAnswerCall = async () => {
        if (!callState.with || !peerConnection.current) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: currentFacingMode }, 
                audio: true 
            });
            setCallState(prev => ({ ...prev, localStream: stream }));

            stream.getTracks().forEach(track => peerConnection.current!.addTrack(track, stream));

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            sendMessage('call-answer', { to: callState.with, answer });
            setCallState(prev => ({ ...prev, status: CallStatus.ACTIVE }));
            incomingCall.pause();
            incomingCall.currentTime = 0;
            outgoingCall.pause();
            outgoingCall.currentTime = 0;
            beepDuringDialingSound.pause();
            beepDuringDialingSound.currentTime = 0;
        } catch (error) {
            console.error("Error answering call:", error);
        }
    };
    
    const handleHangUp = useCallback(() => {
        if (callState.with) {
            sendMessage('hang-up', { to: callState.with });
        }
        cleanupConnection();
        incomingCall.pause();
        incomingCall.currentTime = 0;
        outgoingCall.pause();
        outgoingCall.currentTime = 0;
        beepDuringDialingSound.pause();
        beepDuringDialingSound.currentTime = 0;
        hangUpSound.play();
    }, [callState.with, cleanupConnection, sendMessage]);

    const handleSendMessage = (text: string) => {
        if (!currentUser || !selectedContact) return;
        const message = {
            id: Date.now().toString(),
            sender: currentUser.username,
            receiver: selectedContact.username,
            text,
            timestamp: Date.now()
        };
        sendMessage('chat-message', { ...message, to: selectedContact.username });
        setMessages(prev => ({
            ...prev,
            [selectedContact.username]: [...(prev[selectedContact.username] || []), message]
        }));
        sendMessageSound.play();
    };
    
    const handleSelectContact = (username: string) => {
        const contact = users.find(u => u.username === username);
        if (contact) {
            setSelectedContact(contact);
            setUnreadCounts(prev => ({...prev, [username]: 0}));
        }
    };

    const toggleMute = () => {
        if (callState.localStream) {
            callState.localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (callState.localStream) {
            callState.localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleScreenShare = async () => {
        if (!callState.localStream || !peerConnection.current) return;

        try {
            if (isScreenSharing) {
                // Stop screen sharing, return to camera
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: currentFacingMode }, 
                    audio: true 
                });
                
                // Replace video track
                const videoTrack = stream.getVideoTracks()[0];
                const sender = peerConnection.current.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }

                // Update local stream
                const oldVideoTrack = callState.localStream.getVideoTracks()[0];
                if (oldVideoTrack) {
                    oldVideoTrack.stop();
                    callState.localStream.removeTrack(oldVideoTrack);
                }
                callState.localStream.addTrack(videoTrack);
                
                setIsScreenSharing(false);
            } else {
                // Start screen sharing
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
                    video: true, 
                    audio: true 
                });
                
                // Replace video track
                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = peerConnection.current.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }

                // Update local stream
                const oldVideoTrack = callState.localStream.getVideoTracks()[0];
                if (oldVideoTrack) {
                    oldVideoTrack.stop();
                    callState.localStream.removeTrack(oldVideoTrack);
                }
                callState.localStream.addTrack(videoTrack);

                // Handle screen share end
                videoTrack.onended = () => {
                    toggleScreenShare();
                };

                setIsScreenSharing(true);
            }
        } catch (error) {
            console.error("Error toggling screen share:", error);
        }
    };

    const flipCamera = async () => {
        if (!callState.localStream || !peerConnection.current || isScreenSharing) return;

        try {
            const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            
            // Try with exact facingMode first
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: { exact: newFacingMode } }, 
                    audio: true 
                });
            } catch (exactError) {
                console.log("Exact facingMode failed, trying ideal:", exactError);
                // Fallback to ideal if exact fails
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { facingMode: { ideal: newFacingMode } }, 
                        audio: true 
                    });
                } catch (idealError) {
                    console.log("Ideal facingMode failed, trying without constraints:", idealError);
                    // Last fallback - get any camera
                    stream = await navigator.mediaDevices.getUserMedia({ 
                        video: true, 
                        audio: true 
                    });
                }
            }
            
            // Replace video track
            const videoTrack = stream.getVideoTracks()[0];
            const sender = peerConnection.current.getSenders().find(s => 
                s.track && s.track.kind === 'video'
            );
            if (sender) {
                await sender.replaceTrack(videoTrack);
            }

            // Update local stream
            const oldVideoTrack = callState.localStream.getVideoTracks()[0];
            if (oldVideoTrack) {
                oldVideoTrack.stop();
                callState.localStream.removeTrack(oldVideoTrack);
            }
            callState.localStream.addTrack(videoTrack);
            
            // Stop audio track from new stream as we don't need it
            stream.getAudioTracks().forEach(track => track.stop());
            
            setCurrentFacingMode(newFacingMode);
        } catch (error) {
            console.error("Error flipping camera:", error);
            alert("Camera flip not supported on this device");
        }
    };

    if (!currentUser) {
        return <LoginScreen onAuth={handleAuthentication} />;
    }
    
    if (callState.status === CallStatus.ACTIVE || callState.status === CallStatus.CALLING) {
        return (
            <div className="fixed inset-0 z-50">
                <CallView 
                    callState={callState} 
                    onHangUp={handleHangUp} 
                    onToggleMute={toggleMute} 
                    onToggleVideo={toggleVideo} 
                    onToggleScreenShare={toggleScreenShare}
                    onFlipCamera={flipCamera}
                    isMuted={isMuted} 
                    isVideoEnabled={isVideoEnabled}
                    isScreenSharing={isScreenSharing}
                    canFlipCamera={canFlipCamera}
                />
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex antialiased text-gray-800 dark:text-gray-200 bg-white dark:bg-skype-dark">
            {callState.status === CallStatus.INCOMING && callState.with && (
                <IncomingCallPopup from={callState.with} onAccept={handleAnswerCall} onReject={handleHangUp} />
            )}
            <div className="w-1/4 min-w-[320px] max-w-[400px] border-r border-gray-200 dark:border-skype-dark-gray flex flex-col">
                 <div className="p-4 border-b border-gray-200 dark:border-skype-dark-gray flex justify-between items-center">
                    <div>
                        <div className="flex items-center">
    <img src="/skype_logo.png" alt="Skype Logo" className="w-8 h-8 mr-2" />
    <h1 className="text-2xl font-bold text-skype-accent">Skype</h1>
</div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Logged in as: <strong>{currentUser.username}</strong></p>
                    </div>
                    <button onClick={handleLogout} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    <div className="text-lg font-semibold p-3 text-gray-600 dark:text-gray-300">Contacts</div>
                    {users.map(user => (
                        <ContactItem 
                            key={user.username} 
                            user={user} 
                            isSelected={selectedContact?.username === user.username}
                            onClick={() => handleSelectContact(user.username)}
                            unreadCount={unreadCounts[user.username] || 0}
                        />
                    ))}
                </div>
            </div>
            <div className="flex-grow">
                {selectedContact ? (
                    <ChatWindow
                        currentUser={currentUser}
                        selectedContact={selectedContact}
                        messages={messages[selectedContact.username] || []}
                        onSendMessage={handleSendMessage}
                        onInitiateCall={handleInitiateCall}
                    />
                ) : (
                    <WelcomeScreen />
                )}
            </div>
        </div>
    );
};

const LoginScreen: React.FC<{ onAuth: (type: 'login' | 'register', username: string, pass: string, rememberMe: boolean) => void }> = ({ onAuth }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const handleAction = (type: 'login' | 'register') => {
        if (username.trim() && password.trim()) {
            onAuth(type, username.trim(), password.trim(), rememberMe);
        } else {
            alert('Please enter both username and password.');
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-skype-dark">
            <div className="bg-white dark:bg-skype-dark-gray p-8 rounded-lg shadow-lg w-full max-w-sm">
                <div className="flex items-center justify-center mb-6">
    <img src="/skype_logo.png" alt="Skype Logo" className="w-8 h-8 mr-2" />
    <h1 className="text-2xl font-bold text-skype-accent">Welcome to Skype</h1>
</div>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-skype-accent dark:bg-skype-dark dark:border-gray-600 dark:text-white mb-4"
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-skype-accent dark:bg-skype-dark dark:border-gray-600 dark:text-white"
                />
                <div className="flex items-center mt-4 mb-6">
                    <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="mr-2"
                    />
                    <label htmlFor="rememberMe" className="text-gray-700 dark:text-gray-300">Remember Me</label>
                </div>
                <div className="flex justify-between items-center space-x-2">
                    <button onClick={() => handleAction('login')} className="w-full bg-skype-blue text-white py-2 rounded-lg font-semibold hover:bg-skype-accent transition-colors">
                        Login
                    </button>
                    <button onClick={() => handleAction('register')} className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                        Register
                    </button>
                </div>
            </div>
        </div>
    );
};

const WelcomeScreen: React.FC = () => (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-skype-dark/50">
        <img src="https://picsum.photos/200" alt="Welcome" className="w-48 h-48 rounded-full mb-6" />
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Welcome to Skype!</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Select a contact from the left to start chatting.</p>
    </div>
);

const IncomingCallPopup: React.FC<{ from: string, onAccept: () => void, onReject: () => void }> = ({ from, onAccept, onReject }) => (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-skype-dark-gray p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold mb-2 dark:text-white">Incoming Call</h2>
            <p className="text-lg mb-6 dark:text-gray-300">
                <span className="font-semibold text-skype-accent">{from}</span> is calling...
            </p>
            <div className="flex justify-center space-x-4">
                <button onClick={onReject} className="px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">
                    Reject
                </button>
                <button onClick={onAccept} className="px-6 py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors flex items-center">
                   <PhoneIcon className="w-5 h-5 mr-2"/> Accept
                </button>
            </div>
        </div>
    </div>
);

export default App;
