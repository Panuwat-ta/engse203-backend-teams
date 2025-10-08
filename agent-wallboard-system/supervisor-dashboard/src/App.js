import React, { useState, useEffect, useRef } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Box,              // ← เพิ่ม
  CircularProgress, // ← เพิ่ม
  Typography        // ← เพิ่ม
} from '@mui/material';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { connectSocket, disconnectSocket, getSocket } from './services/socket';
import {
  setToken,
  getToken,
  clearToken,
  setSupervisorData,
  getSupervisorData
} from './services/auth';
import theme from './theme/theme';
import './App.css';
import { transformAgents } from './utils/transformers';

function App() {
  // STATE
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [supervisor, setSupervisor] = useState(null);
  const [teamData, setTeamData] = useState([]);
  const [messages, setMessages] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true); // เพิ่ม loading state

  const socketRef = useRef(null);

  // ✅ เพิ่ม: Restore session เมื่อ component mount
  useEffect(() => {
    const restoreSession = async () => {
      console.log('🔄 Attempting to restore session...');

      const savedToken = getToken();
      const savedSupervisor = getSupervisorData();

      if (savedToken && savedSupervisor) {
        console.log('✅ Found saved session:', savedSupervisor.supervisorCode);

        try {
          // ตรวจสอบว่า token ยังใช้งานได้หรือไม่
          // โดยเรียก API ที่ต้องการ authentication
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/agents/team/${savedSupervisor.teamId}`,
            {
              headers: {
                'Authorization': `Bearer ${savedToken}`
              }
            }
          );

          if (response.ok) {
            const data = await response.json();

            console.log('✅ Session is valid');
            console.log('Raw team data from API:', data);

            // ✅ Transform data โดยใช้ status จาก API
            const transformedAgents = (data.agents || []).map(agent => ({
              agentCode: agent.agent_code || agent.agentCode,
              agentName: agent.agent_name || agent.agentName,
              role: agent.role,
              email: agent.email || '',
              phone: agent.phone || '',
              team_id: agent.team_id || savedSupervisor.teamId,
              // ✅ ใช้ status จาก API แทนการ hardcode
              currentStatus: agent.currentStatus || 'Offline',
              isOnline: false, // จะ update ด้วย WebSocket
              lastUpdate: agent.lastUpdate ? new Date(agent.lastUpdate) : new Date(),
              lastSeen: agent.lastUpdate ? new Date(agent.lastUpdate) : new Date()
            }));

            console.log('✅ Transformed team data:', transformedAgents);

            setSupervisor(savedSupervisor);
            setTeamData(transformedAgents);
            setIsLoggedIn(true);

          } else {
            console.warn('⚠️ Token expired or invalid');
            clearToken();
          }

        } catch (error) {
          console.error('❌ Failed to restore session:', error);
          clearToken();
        }
      } else {
        console.log('ℹ️ No saved session found');
      }

      setIsRestoring(false);
    };

    restoreSession();
  }, []);

  // WebSocket setup
  useEffect(() => {
    if (isLoggedIn && supervisor) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔌 Setting up WebSocket connection...');
      console.log('Supervisor:', supervisor.supervisorCode);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const socket = connectSocket(supervisor.supervisorCode);
      socketRef.current = socket;

      // Event: เชื่อมต่อสำเร็จ
      socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        setSocketConnected(true);
      });

      // Event: ตัดการเชื่อมต่อ
      socket.on('disconnect', () => {
        console.log('⚠️ WebSocket disconnected');
        setSocketConnected(false);
      });



      // ✅ Event: รับข้อมูล online agents เมื่อเชื่อมต่อสำเร็จ
      socket.on('connection_success', (data) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ [SUPERVISOR CONNECTION SUCCESS]');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Online agents:', data.onlineAgents);

  if (data.onlineAgents && data.onlineAgents.length > 0) {
    setTeamData(prev => {
      const updated = prev.map(agent => {
        const onlineAgent = data.onlineAgents.find(
          oa => oa.agentCode === agent.agentCode
        );
        
        if (onlineAgent) {
          console.log(`  ✅ ${agent.agentCode}: online, status=${onlineAgent.status}`);
          return {
            ...agent,
            isOnline: true,
            currentStatus: onlineAgent.status || 'Available', // ✅ ใช้ status จาก backend
            lastUpdate: new Date(onlineAgent.timestamp)
          };
        }
        return agent;
      });
      
      console.log('Updated team data:', updated.map(a => ({
        code: a.agentCode,
        online: a.isOnline,
        status: a.currentStatus
      })));
      
      return updated;
    });
  }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      });


      // Event: Agent เชื่อมต่อ (online)
      socket.on('agent_connected', (data) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🟢 [AGENT CONNECTED]');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Agent code:', data.agentCode);
        console.log('Timestamp:', data.timestamp);

        setTeamData(prev => {
          console.log('Before update:', prev.map(a => ({
            code: a.agentCode,
            online: a.isOnline
          })));

          const updated = prev.map(agent =>
            agent.agentCode === data.agentCode
              ? {
                ...agent,
                isOnline: true,
                currentStatus: 'Available',
                lastSeen: data.timestamp,
                lastUpdate: data.timestamp
              }
              : agent
          );

          console.log('After update:', updated.map(a => ({
            code: a.agentCode,
            online: a.isOnline
          })));

          return updated;
        });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      });

      // Event: Agent ตัดการเชื่อมต่อ (offline)
      socket.on('agent_disconnected', (data) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔴 [AGENT DISCONNECTED]');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Agent code:', data.agentCode);

        setTeamData(prev => prev.map(agent =>
          agent.agentCode === data.agentCode
            ? {
              ...agent,
              isOnline: false,
              currentStatus: 'Offline',
              lastSeen: data.timestamp
            }
            : agent
        ));

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      });

      // Event: Agent เปลี่ยน status
      socket.on('agent_status_update', (data) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 [STATUS UPDATE]');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Agent:', data.agentCode);
        console.log('Status:', data.status);

        setTeamData(prev => prev.map(agent =>
          agent.agentCode === data.agentCode
            ? {
              ...agent,
              currentStatus: data.status,
              lastUpdate: data.timestamp
            }
            : agent
        ));

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      });

      // Event: ข้อความใหม่
      socket.on('new_message', (message) => {
        console.log('💬 New message:', message);
        setMessages(prev => [...prev, message]);
      });

      return () => {
        console.log('🧹 Cleaning up WebSocket...');
        socket.off('connect');
        socket.off('disconnect');
        socket.off('agent_connected');
        socket.off('agent_disconnected');
        socket.off('agent_status_update');
        socket.off('new_message');

        disconnectSocket();
        socketRef.current = null;
        setSocketConnected(false);
      };
    }
  }, [isLoggedIn, supervisor]);

  // Handlers
  const handleLogin = async (loginData) => {
    console.log('✅ Login successful', loginData);

    const supervisorData = {
      supervisorCode: loginData.user.username,   // SP001
      name: loginData.user.fullName,            // Supervisor Alpha
      teamId: loginData.user.teamId,
      teamName: loginData.user.teamName || '',  // ถ้าไม่มีให้ default ''
      email: loginData.user.email || ''         // ถ้าไม่มีให้ default ''
    };

    // แปลงข้อมูล agent ให้เป็นรูปแบบที่ UI ใช้ทันทีหลัง login
    const rawTeamData = loginData.teamData || loginData.agents || [];

    // บันทึก token และ data ก่อนเรียก API เพิ่มเติม
    setToken(loginData.token);
    setSupervisorData(supervisorData);
    setSupervisor(supervisorData);

    try {
      let finalAgents = [];
      if (Array.isArray(rawTeamData) && rawTeamData.length > 0) {
        finalAgents = transformAgents(rawTeamData, supervisorData.teamId);
      } else {
        // ถ้า login response ไม่มี agent list ให้ดึงจาก API ทันที
        const resp = await fetch(
          `${process.env.REACT_APP_API_URL}/agents/team/${supervisorData.teamId}`,
          { headers: { 'Authorization': `Bearer ${loginData.token}` } }
        );
        if (resp.ok) {
          const data = await resp.json();
          finalAgents = transformAgents(data.agents || [], supervisorData.teamId);
        } else {
          console.warn('⚠️ Unable to fetch team agents after login');
        }
      }

      setTeamData(finalAgents);
    } catch (e) {
      console.error('❌ Failed to load team agents after login:', e);
      setTeamData([]);
    }

    // แสดง Dashboard หลังจากตั้งค่า teamData แล้ว เพื่อลดการ flash ว่าไม่มีข้อมูล
    setIsLoggedIn(true);
  };


  const handleLogout = () => {
    console.log('Logging out...');
    clearToken();

    disconnectSocket();

    setIsLoggedIn(false);
    setSupervisor(null);
    setTeamData([]);
    setMessages([]);
    setSocketConnected(false);
    socketRef.current = null;
  };

  const handleSendMessage = (messageData) => {
    console.log('📤 Sending message:', messageData);

    const socket = socketRef.current || getSocket();

    if (!socket || !socket.connected) {
      console.error('❌ Socket not available');
      return;
    }

    socket.emit('send_message', {
      fromCode: supervisor.supervisorCode,
      ...messageData
    });

    setMessages(prev => [...prev, {
      ...messageData,
      fromCode: supervisor.supervisorCode,
      timestamp: new Date()
    }]);
  };

  // ✅ แสดง loading ระหว่าง restore session
  if (isRestoring) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container
          maxWidth="xl"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh'
          }}
        >
          <Box textAlign="center">
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Loading...
            </Typography>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="xl" sx={{ py: 2 }}>
          {!isLoggedIn ? (
            <LoginForm onLogin={handleLogin} />
          ) : (
            <Dashboard
              supervisor={supervisor}
              teamData={teamData}
              messages={messages}
              socketConnected={socketConnected}
              onSendMessage={handleSendMessage}
              onLogout={handleLogout}
            />
          )}
        </Container>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;