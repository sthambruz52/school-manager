import { useState, useEffect } from 'react'
import { db, auth } from '../firebase'
import { collection, doc, setDoc, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'

export default function SupportChat({ isAdmin, userName, userRole }) {
  const [threads, setThreads] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')

  const myUid = auth.currentUser.uid
  const activeThreadId = isAdmin ? selectedUserId : myUid

  // Admin: listen to all chat threads
  useEffect(() => {
    if (!isAdmin) return
    const q = query(collection(db, 'supportChats'), orderBy('lastMessageAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [isAdmin])

  // Everyone: listen to messages in the active thread
  useEffect(() => {
    if (!activeThreadId) { setMessages([]); return }
    const q = query(collection(db, 'supportChats', activeThreadId, 'messages'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [activeThreadId])

  // Mark thread as read when opened
  useEffect(() => {
    if (!activeThreadId) return
    const field = isAdmin ? { unreadByAdmin: false } : { unreadByUser: false }
    setDoc(doc(db, 'supportChats', activeThreadId), field, { merge: true }).catch(() => {})
  }, [activeThreadId, isAdmin])

  const sendMessage = async () => {
    if (!text.trim() || !activeThreadId) return

    await setDoc(doc(db, 'supportChats', activeThreadId), {
      userName: isAdmin ? (threads.find(t => t.id === activeThreadId)?.userName || '') : userName,
      userRole: isAdmin ? (threads.find(t => t.id === activeThreadId)?.userRole || '') : userRole,
      lastMessage: text.trim(),
      lastMessageAt: serverTimestamp(),
      unreadByAdmin: !isAdmin,
      unreadByUser: isAdmin
    }, { merge: true })

    await addDoc(collection(db, 'supportChats', activeThreadId, 'messages'), {
      senderId: myUid,
      senderName: isAdmin ? 'Admin' : userName,
      senderRole: isAdmin ? 'Admin' : userRole,
      text: text.trim(),
      createdAt: serverTimestamp()
    })

    setText('')
  }

  const bubbleStyle = (isMine) => ({
    alignSelf: isMine ? 'flex-end' : 'flex-start',
    background: isMine ? '#1f4d3a' : 'white',
    color: isMine ? 'white' : '#333',
    padding: '8px 12px',
    borderRadius: '12px',
    maxWidth: '75%',
    fontSize: '14px'
  })

  if (isAdmin && !selectedUserId) {
    return (
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ textAlign: 'center' }}>Support Chat</h2>
        {threads.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No conversations yet.</p>
        ) : (
          threads.map(t => (
            <div
              key={t.id}
              onClick={() => setSelectedUserId(t.id)}
              style={{ background: 'white', padding: '14px', margin: '8px 0', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <div style={{ fontWeight: 'bold' }}>{t.userName} <span style={{ fontWeight: 'normal', fontSize: '12px', color: '#888' }}>({t.userRole})</span></div>
                <div style={{ fontSize: '13px', color: '#666' }}>{t.lastMessage}</div>
              </div>
              {t.unreadByAdmin && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#c2704e' }} />}
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div style={{ marginTop: '20px', maxWidth: '600px', margin: '20px auto' }}>
      {isAdmin && (
        <p onClick={() => setSelectedUserId(null)} style={{ color: '#1f4d3a', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Back to conversations
        </p>
      )}
      <h2 style={{ textAlign: 'center' }}>{isAdmin ? threads.find(t => t.id === selectedUserId)?.userName : 'Support Chat'}</h2>
      <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', marginTop: '-10px' }}>
        {isAdmin ? 'Replying as Admin' : "Message our Admin team, we're here to help."}
      </p>

      <div style={{ background: '#fdf6e9', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '300px', maxHeight: '400px', overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', margin: 'auto' }}>No messages yet. Say hello!</p>
        ) : (
          messages.map(m => (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={bubbleStyle(m.senderId === myUid)}>{m.text}</div>
              <span style={{ fontSize: '10px', color: '#aaa', alignSelf: m.senderId === myUid ? 'flex-end' : 'flex-start', marginTop: '2px' }}>
                {m.senderName}
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '10px', borderRadius: '6px' }}
        />
        <button onClick={sendMessage} style={{ background: '#1f4d3a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px' }}>
          Send
        </button>
      </div>
    </div>
  )
}