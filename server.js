
import { WebSocketServer } from 'ws';
import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(__dirname, 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const activeUsers = new Map(); // Map<username, WebSocket>
let registeredUsers = {}; // Record<username, { passwordHash: string }>
let messageHistory = {}; // Record<conversationKey, Message[]>

// --- Data Management ---
const loadData = async (filePath, defaultData) => {
    try {
        await fs.access(filePath);
        const data = await fs.readFile(filePath, 'utf-8');
        return data ? JSON.parse(data) : defaultData;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`[SERVER LOG] ${path.basename(filePath)} not found. Starting fresh.`);
            return defaultData;
        }
        throw error;
    }
};

const saveData = async (filePath, data) => {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`[SERVER LOG] Error saving ${path.basename(filePath)}:`, error);
    }
};

const getConversationKey = (user1, user2) => [user1, user2].sort().join('--');

// --- WebSocket Logic ---
const broadcastUserList = () => {
    const userList = Array.from(activeUsers.keys()).map(username => ({ username }));
    const message = JSON.stringify({ type: 'update-user-list', payload: { users: userList } });
    activeUsers.forEach(ws => ws.send(message));
};

wss.on('connection', (ws) => {
    console.log('[SERVER LOG] A new client connected.');

    ws.on('message', async (rawMessage) => {
        const message = JSON.parse(rawMessage);
        const { type, payload } = message;
        
        switch (type) {
            case 'register':
                try {
                    const { username, password } = payload;
                    if (!username || !password) {
                         return ws.send(JSON.stringify({ type: 'register-error', payload: { message: 'Username and password are required.' } }));
                    }
                    if (registeredUsers[username]) {
                        return ws.send(JSON.stringify({ type: 'register-error', payload: { message: 'Username is already taken.' } }));
                    }
                    const passwordHash = await bcrypt.hash(password, 10);
                    registeredUsers[username] = { passwordHash };
                    await saveData(USERS_FILE, registeredUsers);
                    ws.send(JSON.stringify({ type: 'register-success', payload: { message: 'Registration successful! Please log in.' } }));
                } catch (err) {
                     ws.send(JSON.stringify({ type: 'register-error', payload: { message: 'An error occurred during registration.' } }));
                }
                break;

            case 'login':
                try {
                    const { username, password } = payload;
                    const user = registeredUsers[username];
                    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
                        return ws.send(JSON.stringify({ type: 'login-error', payload: { message: 'Invalid credentials.' } }));
                    }
                    if (activeUsers.has(username)) {
                        return ws.send(JSON.stringify({ type: 'login-error', payload: { message: 'User already logged in.' } }));
                    }

                    ws.username = username;
                    activeUsers.set(username, ws);
                    
                    // Send login success and user list
                    ws.send(JSON.stringify({ type: 'login-success', payload: { username } }));
                    broadcastUserList();

                    // Send relevant message history
                    const userHistory = {};
                    for (const key in messageHistory) {
                        if (key.split('--').includes(username)) {
                            userHistory[key] = messageHistory[key];
                        }
                    }
                    ws.send(JSON.stringify({ type: 'chat-history', payload: { history: userHistory } }));
                    
                    console.log(`[SERVER LOG] User logged in: ${username}`);

                } catch (err) {
                    ws.send(JSON.stringify({ type: 'login-error', payload: { message: 'Server error during login.' } }));
                }
                break;

            case 'chat-message':
            case 'call-offer':
            case 'call-answer':
            case 'ice-candidate':
            case 'hang-up':
                if (!ws.username) return; // Ensure user is authenticated for these actions
                const { to } = payload;

                // For chat messages, save to history
                if (type === 'chat-message') {
                    const conversationKey = getConversationKey(ws.username, to);
                    if (!messageHistory[conversationKey]) {
                        messageHistory[conversationKey] = [];
                    }
                    messageHistory[conversationKey].push(payload);
                    await saveData(MESSAGES_FILE, messageHistory);
                }

                // Relay message to the target user
                const targetWs = activeUsers.get(to);
                if (targetWs) {
                    const messageToSend = JSON.stringify({ type, payload: { ...payload, from: ws.username } });
                    targetWs.send(messageToSend);
                } else {
                    console.log(`[SERVER LOG] Could not relay ${type} to ${to}. User not active.`);
                }
                break;
        }
    });

    ws.on('close', () => {
        if (ws.username) {
            console.log(`[SERVER LOG] Client disconnected: ${ws.username}.`);
            activeUsers.delete(ws.username);
            broadcastUserList();
        }
    });

    ws.on('error', (error) => console.error('[SERVER LOG] WebSocket error:', error));
});

// --- Server Initialization ---
const startServer = async () => {
    try {
        registeredUsers = await loadData(USERS_FILE, {});
        messageHistory = await loadData(MESSAGES_FILE, {});
        
        const buildPath = path.join(__dirname, 'dist');
        app.use(express.static(buildPath));
        app.get('*', (req, res) => res.sendFile(path.join(buildPath, 'index.html')));
        
        server.listen(8080, () => console.log('[SERVER LOG] Server running on http://localhost:8080'));
    } catch (error) {
        console.error("[SERVER LOG] Failed to start server:", error);
        process.exit(1);
    }
};

startServer();

