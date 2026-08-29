import { useState, useEffect } from 'react'
import { db, auth } from '../firebase'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { collection, doc, setDoc, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { MessageCircle, X } from 'lucide-react'

export default function PublicChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [uid, setUid] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [visitorName, setVisitorName] = useState('')
  const [nameSet, setNameSet] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUid(u.uid)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'supportChats', uid, 'messages'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [uid])

  const ensureSignedIn = async () => {
    if (uid) return uid
    const cred = await signInAnonymously(auth)
    setUid(cred.user.uid)
    return cred.user.uid
  }

  const sendMessage = async () => {
    if (!text.trim()) return
    const activeUid = await ensureSignedIn()
    const name = visitorName.trim() || 'Website Visitor'

    await setDoc(doc(db, 'supportChats', activeUid), {
      userName: name,
      userRole: 'Visitor',
      lastMessage: text.trim(),
      lastMessageAt: serverTimestamp(),
      unreadByAdmin: true,
      unreadByUser: false
    }, { merge: true })

    await addDoc(collection(db, 'supportChats', activeUid, 'messages'), {
      senderId: activeUid,
      senderName: name,
      senderRole: 'Visitor',
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
    maxWidth: '80%',
    fontSize: '13px'
  })

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '20px', right: '20px', width: '56px', height: '56px',
          borderRadius: '50%', background: '#1f4d3a', color: 'white', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)', cursor: 'pointer', zIndex: 100
        }}
      >
        <MessageCircle size={26} />
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', width: '320px', maxWidth: '90vw',
      background: '#fdf6e9', borderRadius: '14px', boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
      display: 'flex', flexDirection: 'column', zIndex: 100, overflow: 'hidden'
    }}>
      <div style={{ background: '#1f4d3a', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Chat with us</span>
        <X size={18} style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
      </div>

      {!nameSet ? (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>What's your name? (optional)</p>
          <input
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            placeholder="Your name"
            style={{ padding: '8px', borderRadius: '6px' }}
          />
          <button
            onClick={() => setNameSet(true)}
            style={{ background: '#1f4d3a', color: 'white', border: 'none', padding: '8px', borderRadius: '6px' }}
          >
            Start Chat
          </button>
        </div>
      ) : (
        <>
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '200px', maxHeight: '280px', overflowY: 'auto' }}>
            {messages.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', margin: 'auto' }}>Say hello, we're happy to help!</p>
            ) : (
              messages.map(m => (
                <div key={m.id} style={bubbleStyle(m.senderId === uid)}>{m.text}</div>
              ))
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', padding: '10px' }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              style={{ flex: 1, padding: '8px', borderRadius: '6px' }}
            />
            <button onClick={sendMessage} style={{ background: '#1f4d3a', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px' }}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  )
}