// models/Agent.js - Enhanced Agent model with methods
// 👉 ไฟล์นี้ใช้สร้าง "Agent" object สำหรับเก็บข้อมูลของพนักงาน call center
// 👉 ใน Phase 1 ยังไม่ใช้ Database จริง แต่จะเก็บใน memory (Map) ก่อน

class Agent {
  constructor(data) {
    // สร้าง unique id (ถ้าไม่มีส่งเข้ามา) ด้วย generateId()
    this.id = data.id || this.generateId();

    // รหัสประจำตัว agent (เช่น A001)
    this.agentCode = data.agentCode;

    // ชื่อ-อีเมล-แผนก
    this.name = data.name;
    this.email = data.email;
    this.department = data.department || 'General';

    // ความสามารถ (skills เช่น ภาษา, ความรู้เฉพาะด้าน)
    this.skills = data.skills || [];

    // สถานะเริ่มต้น = Available
    this.status = data.status || 'Available';

    // บ่งบอกว่า agent ยัง active อยู่ไหม
    this.isActive = data.isActive !== undefined ? data.isActive : true;

    // เวลาที่ login เข้าระบบ
    this.loginTime = data.loginTime || null;

    // เวลาล่าสุดที่เปลี่ยนสถานะ
    this.lastStatusChange = new Date();

    // เก็บประวัติการเปลี่ยนสถานะทั้งหมด
    this.statusHistory = data.statusHistory || [];

    // เวลาสร้างและอัพเดทล่าสุด
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = new Date();
  }

  // ฟังก์ชันสร้าง id แบบสุ่ม ใช้ใน Phase 1 (ยังไม่ใช้ database)
  generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }

  // ฟังก์ชันอัพเดทสถานะ พร้อมบันทึกประวัติ
  updateStatus(newStatus, reason = null) {
    this.statusHistory.push({
      from: this.status,
      to: newStatus,
      reason,
      timestamp: new Date()
    });

    this.status = newStatus;
    this.lastStatusChange = new Date();
    this.updatedAt = new Date();
  }

  // ฟังก์ชันส่งข้อมูลออกมาในรูป JSON (สำหรับ API response)
  toJSON() {
    return {
      id: this.id,
      agentCode: this.agentCode,
      name: this.name,
      email: this.email,
      department: this.department,
      skills: this.skills,
      status: this.status,
      isActive: this.isActive,
      loginTime: this.loginTime,
      lastStatusChange: this.lastStatusChange,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // ฟังก์ชันให้ admin ดูประวัติการเปลี่ยนสถานะ
  getStatusHistory() {
    return this.statusHistory;
  }
}

// ✅ เก็บ agent ทั้งหมดไว้ใน Map (ทำหน้าที่เหมือน database ชั่วคราว)
const agents = new Map();

// ✅ สร้าง sample data สำหรับทดสอบ API
function initializeSampleData() {
  const sampleAgents = [
    {
      agentCode: 'A001',
      name: 'John Doe', 
      email: 'john.doe@company.com',
      department: 'Sales',
      skills: ['Thai', 'English', 'Sales'],
      status: 'Available'
    },
    {
      agentCode: 'A002',
      name: 'Jane Smith',
      email: 'jane.smith@company.com', 
      department: 'Support',
      skills: ['Thai', 'Technical Support'],
      status: 'Busy'
    },
    {
      agentCode: 'S001',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@company.com',
      department: 'Technical', 
      skills: ['English', 'Technical', 'Supervisor'],
      status: 'Available'
    },
        {
      agentCode: 'B001',
      name: 'panuwat',
      email: 'panuwat@gmail.com',
      department: 'Technical', 
      skills: ['English', 'Technical', 'Supervisor'],
      status: 'Available'
    }

  ];

  // เพิ่ม agent ทั้งหมดเข้า Map
  sampleAgents.forEach(data => {
    const agent = new Agent(data);
    agents.set(agent.id, agent);
    console.log(`🆔 Agent ${agent.agentCode} has ID: ${agent.id}`);
    console.log('📋 All agent IDs in system:', Array.from(agents.keys()));
  });

  console.log(`✅ Initialized ${agents.size} sample agents`);
}

// เรียกฟังก์ชันสร้าง sample data ตอนเริ่มต้น
initializeSampleData();

module.exports = { Agent, agents };
