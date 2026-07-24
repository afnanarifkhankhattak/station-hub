import React, { createContext, useContext, useEffect, useState } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../firebase' // adjust path

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const q = query(collection(db, 'bookings'))

    const unsub = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.filter(d => !d.data().dashboardRead).length
      setUnreadCount(count)
    })

    return () => unsub()
  }, [])

  return (
    <NotificationContext.Provider value={{ unreadCount }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)