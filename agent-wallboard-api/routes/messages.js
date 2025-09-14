// routes/messages.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
// ดูข้อความทั้งหมด
router.get('/', messageController.getAllMessages);

// ส่งข้อความ
router.post('/', messageController.sendMessage);

// ดูข้อความของ Agent
router.get('/:agentCode', messageController.getMessagesForAgent);

// อัปเดตข้อความ
router.put('/:id', messageController.updateMessage);

// ลบข้อความ
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
