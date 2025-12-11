'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function BoardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Get current date for date box
  const currentDate = new Date()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = monthNames[currentDate.getMonth()]
  const currentDay = currentDate.getDate()

  return (
    <div 
      className="flex items-center justify-center"
      style={{ 
        minHeight: 'calc(100vh - 80px)',
        padding: '24px',
      }}
    >
      {/* Card Component */}
      <div 
        className="relative"
        style={{
          width: '300px',
          padding: '20px',
          perspective: '1000px',
        }}
      >
        <div
          className="card"
          style={{
            paddingTop: '50px',
            border: '3px solid rgb(255, 255, 255)',
            transformStyle: 'preserve-3d',
            background: 'linear-gradient(135deg,#0000 18.75%,#f3f3f3 0 31.25%,#0000 0), repeating-linear-gradient(45deg,#f3f3f3 -6.25% 6.25%,#ffffff 0 18.75%)',
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 0 0',
            backgroundColor: '#f0f0f0',
            width: '100%',
            boxShadow: 'rgba(142, 142, 142, 0.3) 0px 30px 30px -10px',
            transition: 'all 0.5s ease-in-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundPosition = '-100px 100px, -100px 100px'
            e.currentTarget.style.transform = 'rotate3d(0.5, 1, 0, 30deg)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundPosition = '0 0, 0 0'
            e.currentTarget.style.transform = 'rotate3d(0, 0, 0, 0deg)'
          }}
        >
          {/* Date Box */}
          <div
            className="absolute"
            style={{
              top: '30px',
              right: '30px',
              height: '60px',
              width: '60px',
              background: 'white',
              border: '1px solid rgb(7, 185, 255)',
              padding: '10px',
              transform: 'translate3d(0px, 0px, 80px)',
              boxShadow: 'rgba(100, 100, 111, 0.2) 0px 17px 10px -10px',
            }}
          >
            <span className="block text-center" style={{ color: 'rgb(4, 193, 250)', fontSize: '9px', fontWeight: '700' }}>
              {currentMonth}
            </span>
            <span className="block text-center" style={{ fontSize: '20px', fontWeight: '900', color: 'rgb(4, 193, 250)' }}>
              12
            </span>
          </div>

          {/* Content Box */}
          <div
            className="content-box"
            style={{
              background: 'rgba(4, 193, 250, 0.732)',
              transition: 'all 0.5s ease-in-out',
              padding: '60px 25px 25px 25px',
              transformStyle: 'preserve-3d',
            }}
          >
            <h2
              className="card-title inline-block"
              style={{
                color: 'white',
                fontSize: '25px',
                fontWeight: '900',
                transition: 'all 0.5s ease-in-out',
                transform: 'translate3d(0px, 0px, 50px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate3d(0px, 0px, 60px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate3d(0px, 0px, 50px)'
              }}
            >
              Aoi Nai
            </h2>
            <p
              className="card-content"
              style={{
                marginTop: '10px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#f2f2f2',
                transition: 'all 0.5s ease-in-out',
                transform: 'translate3d(0px, 0px, 30px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate3d(0px, 0px, 60px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate3d(0px, 0px, 30px)'
              }}
            >
              You will see some of our conversations about psychiatry and philosophy; they are very interesting and may help alleviate illness.
            </p>
            <button
              className="see-more cursor-pointer inline-block"
              style={{
                marginTop: '1rem',
                fontWeight: '900',
                fontSize: '9px',
                textTransform: 'uppercase',
                color: 'rgb(7, 185, 255)',
                background: 'white',
                padding: '0.5rem 0.7rem',
                border: 'none',
                transition: 'all 0.5s ease-in-out',
                transform: 'translate3d(0px, 0px, 20px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate3d(0px, 0px, 60px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate3d(0px, 0px, 20px)'
              }}
            >
              See More
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

