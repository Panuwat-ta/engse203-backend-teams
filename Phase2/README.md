# Phase 2

## API Endpoints Test
- GET http://localhost:3001/api/health
![alt text](./img/Health-check.png)

## CRUD Operations Test (MongoDB)
- POST http://localhost:3001/api/agents
![alt text](./img/Create-agent.png)

- GET http://localhost:3001/api/agents
![alt text](./img/Get-all-agents.png)

- mongodb 
![alt text](./img/mongode1.png)

## Message System Test
- POST http://localhost:3001/api/messages
![alt text](./img/Send-message.png)

- GET http://localhost:3001/api/messages/A101
![alt text](./img/Get-messages-for-agent.png)

## WebSocket Test
1. Click "Connect" 
2. Enter agent code "A101"
3. Click "Login as Agent"
4. Try "Update Status"
5. Try "Send Message"
6. Click "Join Dashboard"
![alt text](./img/test-websocket.html-in-browser.png)