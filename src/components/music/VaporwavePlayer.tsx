'use client'

import { useState, useRef, useEffect } from 'react'
import './VaporwavePlayer.css'

interface Track {
  id: string
  name: string
  artist: string
  url: string
  cover?: string
}

const DEFAULT_TRACKS: Track[] = [
  {
    id: '1',
    name: 'リサフランク420 / 現代のコンピュー',
    artist: 'Macintosh Plus',
    // 使用公共测试音频URL（如果无法访问，请替换为您自己的音频文件URL）
    url: 'https://archive.org/download/testmp3testfile/mpthreetest.mp3',
  },
  {
    id: '2',
    name: '私の愛は',
    artist: 'Vektroid',
    // 备用测试音频URL
    url: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
  },
  {
    id: '3',
    name: '新しいエーテル',
    artist: 'Blank Banshee',
    // 另一个测试音频URL
    url: 'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav',
  },
]

// 注意：上述URL为示例测试音频，实际使用时请替换为您自己的音频文件URL
// 如何添加您自己的音乐：
// 1. 将音频文件上传到您的服务器或CDN
// 2. 获取音频文件的完整URL
// 3. 替换上述数组中的url字段
// 4. 确保音频格式被浏览器支持（MP3、OGG、WAV等）
// 5. 确保服务器设置了正确的CORS头（如果跨域）

export default function VaporwavePlayer() {
  const [isMinimized, setIsMinimized] = useState(true) // 默认收起
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(true) // 默认静音
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLooping, setIsLooping] = useState(false)
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128))
  const [isGlitching, setIsGlitching] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const currentTrack = DEFAULT_TRACKS[currentTrackIndex]

  // 初始化音频上下文和频谱分析
  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current
    let audioContext: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let source: MediaElementAudioSourceNode | null = null

    const initAudioContext = () => {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        source = audioContext.createMediaElementSource(audio)
        source.connect(analyser)
        analyser.connect(audioContext.destination)

        audioContextRef.current = audioContext
        analyserRef.current = analyser
      } catch (error) {
        console.error('音频上下文初始化失败:', error)
      }
    }

    // 用户交互后初始化
    const handleUserInteraction = () => {
      if (!audioContext) {
        initAudioContext()
        document.removeEventListener('click', handleUserInteraction)
        document.removeEventListener('touchstart', handleUserInteraction)
      }
    }

    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('touchstart', handleUserInteraction)

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close()
      }
    }
  }, [])

  // 频谱可视化
  useEffect(() => {
    if (!analyserRef.current || !isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    const analyser = analyserRef.current
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const updateSpectrum = () => {
      analyser.getByteFrequencyData(dataArray)
      setAudioData(dataArray)
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateSpectrum)
      }
    }

    updateSpectrum()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying])

  // 加载本地存储的设置
  useEffect(() => {
    const savedVolume = localStorage.getItem('vaporwave-player-volume')
    const savedTrackIndex = localStorage.getItem('vaporwave-player-track')
    const savedLooping = localStorage.getItem('vaporwave-player-loop')

    if (savedVolume) {
      setVolume(parseFloat(savedVolume))
    }
    if (savedTrackIndex) {
      const index = parseInt(savedTrackIndex)
      if (index >= 0 && index < DEFAULT_TRACKS.length) {
        setCurrentTrackIndex(index)
      }
    }
    if (savedLooping) {
      setIsLooping(savedLooping === 'true')
    }
  }, [])

  // 保存设置到本地存储
  useEffect(() => {
    localStorage.setItem('vaporwave-player-volume', volume.toString())
  }, [volume])

  useEffect(() => {
    localStorage.setItem('vaporwave-player-track', currentTrackIndex.toString())
  }, [currentTrackIndex])

  useEffect(() => {
    localStorage.setItem('vaporwave-player-loop', isLooping.toString())
  }, [isLooping])

  // 音频事件处理
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      if (isLooping) {
        audio.play()
      } else {
        handleNext()
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [isLooping])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleNext()
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(Math.min(1, volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(Math.max(0, volume - 0.1))
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [volume, isPlaying, isMuted])


  // 更新音频播放状态
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      console.log('音频元素不存在')
      return
    }

    console.log('useEffect 触发, 状态:', { isPlaying, isMuted, volume, currentTrackIndex })

    // 设置音量和循环
    audio.volume = isMuted ? 0 : volume
    audio.loop = isLooping

    // 播放逻辑
    if (isPlaying && !isMuted) {
      console.log('尝试播放音频:', currentTrack.name)
      // 尝试播放
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('播放成功:', currentTrack.name)
          })
          .catch((error) => {
            console.error('播放失败:', error)
            console.error('错误详情:', {
              name: error.name,
              message: error.message,
              code: (error as any).code
            })
            setIsPlaying(false)
            // 如果是用户交互问题，提示用户
            if (error.name === 'NotAllowedError') {
              console.warn('需要用户交互才能播放音频')
            } else if (error.name === 'NotSupportedError') {
              console.error('音频格式不支持或URL无效:', currentTrack.url)
            }
          })
      }
    } else if (!isPlaying) {
      console.log('暂停音频')
      audio.pause()
    }
  }, [isPlaying, isMuted, volume, isLooping, currentTrackIndex, currentTrack.name])

  const togglePlay = () => {
    console.log('togglePlay 被调用, 当前状态:', { isPlaying, isMuted, volume })
    
    // 如果当前是静音状态，先取消静音
    if (isMuted) {
      console.log('取消静音并开始播放')
      setIsMuted(false)
      // 使用 useEffect 来处理状态更新后的播放
      // 先设置 isMuted 为 false，然后设置 isPlaying 为 true
      setTimeout(() => {
        setIsPlaying(true)
      }, 10)
    } else {
      // 直接切换播放状态
      console.log('切换播放状态:', !isPlaying)
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const triggerGlitch = () => {
    setIsGlitching(true)
    setTimeout(() => setIsGlitching(false), 500)
  }

  const handlePrevious = () => {
    triggerGlitch()
    const newIndex = currentTrackIndex === 0 ? DEFAULT_TRACKS.length - 1 : currentTrackIndex - 1
    setCurrentTrackIndex(newIndex)
    setCurrentTime(0)
    if (isPlaying) {
      setTimeout(() => {
        audioRef.current?.play()
      }, 100)
    }
  }

  const handleNext = () => {
    triggerGlitch()
    const newIndex = (currentTrackIndex + 1) % DEFAULT_TRACKS.length
    setCurrentTrackIndex(newIndex)
    setCurrentTime(0)
    if (isPlaying) {
      setTimeout(() => {
        audioRef.current?.play()
      }, 100)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div 
      className={`vapor-music-player ${isMinimized ? 'minimized' : ''} ${isGlitching ? 'vhs-glitch' : ''}`}
      style={{
        position: 'absolute',
        top: '10px',
        right: '20px',
        zIndex: 10,
        width: isMinimized ? '280px' : '360px',
        transition: 'all 0.3s ease',
      }}
    >
      {/* 音频元素 */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        preload="metadata"
        crossOrigin="anonymous"
        onError={(e) => {
          const audioElement = e.currentTarget as HTMLAudioElement
          const error = audioElement.error
          let errorMsg = `音频加载失败: ${currentTrack.name}\nURL: ${currentTrack.url}\n`
          if (error) {
            switch (error.code) {
              case error.MEDIA_ERR_ABORTED:
                errorMsg += '原因: 音频加载被中止'
                break
              case error.MEDIA_ERR_NETWORK:
                errorMsg += '原因: 网络错误，请检查URL是否可访问或CORS设置'
                break
              case error.MEDIA_ERR_DECODE:
                errorMsg += '原因: 音频解码失败，格式可能不支持'
                break
              case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMsg += '原因: 音频格式不支持或URL无效\n\n提示：请编辑 src/components/music/VaporwavePlayer.tsx 文件，将 DEFAULT_TRACKS 数组中的 url 替换为您自己的音频文件URL'
                break
              default:
                errorMsg += `原因: 未知错误 (错误代码: ${error.code})`
            }
          }
          console.error(errorMsg)
        }}
        onLoadedData={() => {
          console.log('音频加载成功:', currentTrack.name)
        }}
        onCanPlay={() => {
          console.log('音频可以播放:', currentTrack.name)
        }}
      />

      {/* 播放器容器 */}
      <div className="vapor-player-container">
        {/* 标题栏 */}
        <div className="vapor-player-header">
          <div className="vapor-player-title">
            <span className="vapor-pixel-icon">🎵</span>
            <span>VAPORWAVE PLAYER</span>
          </div>
          <div className="vapor-player-controls">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="vapor-player-minimize"
              title={isMinimized ? '展开' : '最小化'}
            >
              {isMinimized ? '□' : '_'}
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* 频谱可视化 */}
            <div className="vapor-player-spectrum">
              {Array.from({ length: 32 }).map((_, i) => {
                const barHeight = (audioData[i * 4] || 0) / 255 * 100
                return (
                  <div
                    key={i}
                    className="vapor-spectrum-bar"
                    style={{
                      height: `${Math.max(5, barHeight)}%`,
                      background: `linear-gradient(180deg, 
                        var(--vapor-pink) 0%, 
                        var(--vapor-purple) 50%, 
                        var(--vapor-cyan) 100%)`,
                      boxShadow: `0 0 ${barHeight / 2}px var(--vapor-pink)`,
                    }}
                  />
                )
              })}
            </div>

            {/* 曲目信息 */}
            <div className="vapor-player-track-info">
              <div className="vapor-track-name vapor-vhs-title">
                {currentTrack.name}
              </div>
              <div className="vapor-track-artist">
                {currentTrack.artist}
              </div>
            </div>

            {/* 进度条 */}
            <div className="vapor-player-progress">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="vapor-progress-slider"
              />
              <div className="vapor-progress-time">
                <span className="vapor-digital-clock">{formatTime(currentTime)}</span>
                <span className="vapor-digital-clock">{formatTime(duration)}</span>
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="vapor-player-buttons">
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`vapor-player-btn ${isLooping ? 'active' : ''}`}
                title="循环播放"
              >
                🔁
              </button>
              <button
                onClick={handlePrevious}
                className="vapor-player-btn"
                title="上一曲"
              >
                ⏮
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('播放按钮被点击, 当前状态:', { isPlaying, isMuted })
                  togglePlay()
                }}
                className={`vapor-player-btn vapor-play-btn ${isPlaying ? 'playing' : ''}`}
                title={isPlaying ? '暂停' : '播放'}
                type="button"
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                onClick={handleNext}
                className="vapor-player-btn"
                title="下一曲"
              >
                ⏭
              </button>
              <button
                onClick={toggleMute}
                className={`vapor-player-btn ${isMuted ? 'muted' : ''}`}
                title={isMuted ? '取消静音' : '静音'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>

            {/* 音量控制 */}
            <div className="vapor-player-volume">
              <span className="vapor-pixel-icon">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="vapor-volume-slider"
              />
              <span className="vapor-volume-value vapor-digital-clock">
                {Math.round(volume * 100)}%
              </span>
            </div>

            {/* 曲目列表 */}
            <div className="vapor-player-playlist">
              <div className="vapor-playlist-header">播放列表</div>
              <div className="vapor-playlist-items">
                {DEFAULT_TRACKS.map((track, index) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      triggerGlitch()
                      setCurrentTrackIndex(index)
                      setCurrentTime(0)
                      if (isPlaying) {
                        setTimeout(() => {
                          audioRef.current?.play()
                        }, 100)
                      }
                    }}
                    className={`vapor-playlist-item ${index === currentTrackIndex ? 'active' : ''}`}
                  >
                    <span className="vapor-pixel-icon">
                      {index === currentTrackIndex && isPlaying ? '▶' : '○'}
                    </span>
                    <span className="vapor-playlist-track-name">{track.name}</span>
                    <span className="vapor-playlist-artist">{track.artist}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

