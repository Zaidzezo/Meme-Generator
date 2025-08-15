import { useEffect, useState, useRef, useCallback } from "react"

export default function Main() {
    const [meme, setMeme] = useState({
        imageUrl: "http://i.imgflip.com/1bij.jpg",
        imageFilter: "none",
        brightness: 1,
        contrast: 1,
        saturation: 1
    })

    const [textElements, setTextElements] = useState([
        {
            id: 1,
            text: "TOP TEXT",
            position: { x: 50, y: 15 },
            fontSize: 2.5,
            color: "#ffffff",
            strokeColor: "#000000",
            strokeWidth: 3,
            fontFamily: "Impact",
            fontWeight: "900",
            letterSpacing: 2,
            rotation: 0,
            opacity: 1,
            textAlign: "center",
            isSelected: false,
            shadow: { x: 2, y: 2, blur: 4, color: "rgba(0,0,0,0.5)" }
        },
        {
            id: 2,
            text: "BOTTOM TEXT",
            position: { x: 50, y: 85 },
            fontSize: 2.5,
            color: "#ffffff",
            strokeColor: "#000000",
            strokeWidth: 3,
            fontFamily: "Impact",
            fontWeight: "900",
            letterSpacing: 2,
            rotation: 0,
            opacity: 1,
            textAlign: "center",
            isSelected: false,
            shadow: { x: 2, y: 2, blur: 4, color: "rgba(0,0,0,0.5)" }
        }
    ])

    const [selectedTextId, setSelectedTextId] = useState(1)
    const [allMemes, setAllMemes] = useState([])
    const [dragState, setDragState] = useState({ isDragging: false, textId: null })
    const [isLoading, setIsLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [favorites, setFavorites] = useState([])
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [activeTab, setActiveTab] = useState("text")
    const [history, setHistory] = useState([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [showPreview, setShowPreview] = useState(false)
    const memeRef = useRef(null)

    const fontFamilies = [
        "Impact", "Arial Black", "Helvetica", "Times New Roman", 
        "Comic Sans MS", "Verdana", "Georgia", "Trebuchet MS"
    ]

    const presetStyles = {
        classic: { color: "#ffffff", strokeColor: "#000000", strokeWidth: 3, fontFamily: "Impact" },
        modern: { color: "#2c3e50", strokeColor: "#ffffff", strokeWidth: 2, fontFamily: "Arial Black" },
        neon: { color: "#00ffff", strokeColor: "#ff00ff", strokeWidth: 1, fontFamily: "Impact" },
        retro: { color: "#ffff00", strokeColor: "#ff0000", strokeWidth: 4, fontFamily: "Impact" },
        minimal: { color: "#333333", strokeColor: "transparent", strokeWidth: 0, fontFamily: "Helvetica" },
        comic: { color: "#ff6b6b", strokeColor: "#4ecdc4", strokeWidth: 2, fontFamily: "Comic Sans MS" }
    }

    useEffect(() => {
        const savedFavorites = JSON.parse(localStorage.getItem('memeFavorites') || '[]')
        setFavorites(savedFavorites)
        
        setIsLoading(true)
        fetch("https://api.imgflip.com/get_memes")
            .then(res => res.json())
            .then(data => {
                setAllMemes(data.data.memes)
                setIsLoading(false)
            })
            .catch(err => {
                console.error("Failed to fetch memes:", err)
                setIsLoading(false)
            })
    }, [])

    const filteredMemes = allMemes.filter(meme => 
        meme.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const selectedText = textElements.find(el => el.id === selectedTextId)

    const saveToHistory = useCallback(() => {
        const newState = { textElements: [...textElements], meme: {...meme} }
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(newState)
        setHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
    }, [textElements, meme, history, historyIndex])

    const undo = () => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1]
            setTextElements(prevState.textElements)
            setMeme(prevState.meme)
            setHistoryIndex(historyIndex - 1)
        }
    }

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1]
            setTextElements(nextState.textElements)
            setMeme(nextState.meme)
            setHistoryIndex(historyIndex + 1)
        }
    }

    function getMemeImage() {
        if (filteredMemes.length === 0) return
        const randomNumber = Math.floor(Math.random() * filteredMemes.length)
        const newMemeUrl = filteredMemes[randomNumber].url
        setMeme(prevMeme => ({ ...prevMeme, imageUrl: newMemeUrl }))
        saveToHistory()
    }

    function selectSpecificMeme(memeUrl) {
        setMeme(prevMeme => ({ ...prevMeme, imageUrl: memeUrl }))
        saveToHistory()
    }

    function addNewText() {
        const newId = Math.max(...textElements.map(el => el.id)) + 1
        const newTextElement = {
            id: newId,
            text: "NEW TEXT",
            position: { x: 50, y: 50 },
            fontSize: 2.5,
            color: "#ffffff",
            strokeColor: "#000000",
            strokeWidth: 3,
            fontFamily: "Impact",
            fontWeight: "900",
            letterSpacing: 2,
            rotation: 0,
            opacity: 1,
            textAlign: "center",
            isSelected: false,
            shadow: { x: 2, y: 2, blur: 4, color: "rgba(0,0,0,0.5)" }
        }
        setTextElements(prev => [...prev, newTextElement])
        setSelectedTextId(newId)
        saveToHistory()
    }

    function deleteText(id) {
        if (textElements.length <= 1) return
        setTextElements(prev => prev.filter(el => el.id !== id))
        if (selectedTextId === id) {
            setSelectedTextId(textElements.find(el => el.id !== id)?.id || textElements[0].id)
        }
        saveToHistory()
    }

    function duplicateText() {
        if (!selectedText) return
        const newId = Math.max(...textElements.map(el => el.id)) + 1
        const duplicatedText = {
            ...selectedText,
            id: newId,
            text: selectedText.text + " COPY",
            position: { 
                x: Math.min(selectedText.position.x + 10, 90), 
                y: Math.min(selectedText.position.y + 10, 90) 
            }
        }
        setTextElements(prev => [...prev, duplicatedText])
        setSelectedTextId(newId)
        saveToHistory()
    }

    function updateSelectedText(property, value) {
        setTextElements(prev => prev.map(el => 
            el.id === selectedTextId 
                ? { ...el, [property]: value }
                : el
        ))
    }

    function updateSelectedTextShadow(property, value) {
        setTextElements(prev => prev.map(el => 
            el.id === selectedTextId 
                ? { ...el, shadow: { ...el.shadow, [property]: value } }
                : el
        ))
    }

    function handleTextChange(event) {
        updateSelectedText('text', event.target.value)
    }

    function handleMemeChange(event) {
        const { value, name } = event.target
        setMeme(prevMeme => ({ ...prevMeme, [name]: parseFloat(value) || value }))
    }

    function handleMouseDown(event, textId) {
        event.preventDefault()
        setDragState({ isDragging: true, textId })
        setSelectedTextId(textId)
    }

    const handleMouseMove = useCallback((event) => {
        if (!dragState.isDragging || !memeRef.current) return

        const img = memeRef.current.querySelector('img')
        if (!img) return

        const rect = img.getBoundingClientRect()
        const x = ((event.clientX - rect.left) / rect.width) * 100
        const y = ((event.clientY - rect.top) / rect.height) * 100

        const margin = 5
        const clampedX = Math.max(margin, Math.min(100 - margin, x))
        const clampedY = Math.max(margin, Math.min(100 - margin, y))

        setTextElements(prev => prev.map(el => 
            el.id === dragState.textId 
                ? { ...el, position: { x: clampedX, y: clampedY } }
                : el
        ))
    }, [dragState])

    function handleMouseUp() {
        if (dragState.isDragging) {
            saveToHistory()
        }
        setDragState({ isDragging: false, textId: null })
    }

    useEffect(() => {
        if (dragState.isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [dragState.isDragging, handleMouseMove])

    function resetPositions() {
        setTextElements(prev => prev.map((el, index) => ({
            ...el,
            position: index === 0 ? { x: 50, y: 15 } : index === 1 ? { x: 50, y: 85 } : { x: 50, y: 50 }
        })))
        saveToHistory()
    }

    function applyPresetStyle(presetName) {
        const preset = presetStyles[presetName]
        updateSelectedText('color', preset.color)
        updateSelectedText('strokeColor', preset.strokeColor)
        updateSelectedText('strokeWidth', preset.strokeWidth)
        updateSelectedText('fontFamily', preset.fontFamily)
        
        if (presetName === 'neon') {
            setMeme(prev => ({ ...prev, contrast: 1.2, saturation: 1.3 }))
        } else if (presetName === 'retro') {
            setMeme(prev => ({ ...prev, brightness: 1.1, contrast: 1.1, saturation: 0.8 }))
        }
        saveToHistory()
    }

    function addToFavorites() {
        const newFavorite = {
            id: Date.now(),
            imageUrl: meme.imageUrl,
            textElements: textElements,
            memeSettings: meme,
            timestamp: new Date().toLocaleString(),
            name: `Meme ${new Date().toLocaleDateString()}`
        }
        const updatedFavorites = [...favorites, newFavorite]
        setFavorites(updatedFavorites)
    }

    function loadFavorite(favorite) {
        setMeme(favorite.memeSettings)
        setTextElements(favorite.textElements)
        setSelectedTextId(favorite.textElements[0]?.id || 1)
        saveToHistory()
    }

    function downloadMeme() {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.crossOrigin = 'anonymous'
        img.onload = function() {
            canvas.width = img.width
            canvas.height = img.height

            ctx.filter = `brightness(${meme.brightness}) contrast(${meme.contrast}) saturate(${meme.saturation})`
            ctx.drawImage(img, 0, 0)
            ctx.filter = 'none'

            textElements.forEach(textEl => {
                const x = (textEl.position.x / 100) * canvas.width
                const y = (textEl.position.y / 100) * canvas.height
                
                ctx.save()
                ctx.globalAlpha = textEl.opacity
                ctx.translate(x, y)
                ctx.rotate((textEl.rotation * Math.PI) / 180)

                ctx.font = `${textEl.fontWeight} ${textEl.fontSize * 30}px ${textEl.fontFamily}, Impact, sans-serif`
                ctx.textAlign = textEl.textAlign
                ctx.textBaseline = 'middle'
                ctx.letterSpacing = `${textEl.letterSpacing}px`
                
                if (textEl.shadow.blur > 0) {
                    ctx.shadowColor = textEl.shadow.color
                    ctx.shadowBlur = textEl.shadow.blur * 2
                    ctx.shadowOffsetX = textEl.shadow.x * 2
                    ctx.shadowOffsetY = textEl.shadow.y * 2
                }

                if (textEl.strokeWidth > 0) {
                    ctx.strokeStyle = textEl.strokeColor
                    ctx.lineWidth = textEl.strokeWidth * 3
                    ctx.strokeText(textEl.text.toUpperCase(), 0, 0)
                }

                ctx.fillStyle = textEl.color
                ctx.fillText(textEl.text.toUpperCase(), 0, 0)
                
                ctx.restore()
            })
            
            const link = document.createElement('a')
            link.download = `meme-${Date.now()}.png`
            link.href = canvas.toDataURL('image/png', 1.0)
            link.click()
        }
        
        img.src = meme.imageUrl
    }

    return (
        <main className="main-container">
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>🎨 Meme Studio Pro</h2>
                    <div className="history-controls">
                        <button onClick={undo} disabled={historyIndex <= 0} title="Undo">
                            ↶
                        </button>
                        <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo">
                            ↷
                        </button>
                    </div>
                </div>

                <div className="tab-navigation">
                    <button 
                        className={activeTab === "text" ? "active" : ""}
                        onClick={() => setActiveTab("text")}
                    >
                        📝 Text
                    </button>
                    <button 
                        className={activeTab === "image" ? "active" : ""}
                        onClick={() => setActiveTab("image")}
                    >
                        🖼️ Image
                    </button>
                    <button 
                        className={activeTab === "library" ? "active" : ""}
                        onClick={() => setActiveTab("library")}
                    >
                        📚 Library
                    </button>
                </div>

                {activeTab === "text" && (
                    <div className="tab-content">
                        <div className="text-elements-section">
                            <div className="section-header">
                                <h3>Text Elements</h3>
                                <button className="add-btn" onClick={addNewText}>
                                    + Add Text
                                </button>
                            </div>
                            
                            <div className="text-elements-list">
                                {textElements.map(textEl => (
                                    <div 
                                        key={textEl.id}
                                        className={`text-element-item ${textEl.id === selectedTextId ? 'selected' : ''}`}
                                        onClick={() => setSelectedTextId(textEl.id)}
                                    >
                                        <div className="text-preview">
                                            <span className="text-icon">📝</span>
                                            <span className="text-content">{textEl.text || "Empty Text"}</span>
                                        </div>
                                        <div className="text-actions">
                                            <button onClick={(e) => { e.stopPropagation(); duplicateText() }} title="Duplicate">
                                                📋
                                            </button>
                                            {textElements.length > 1 && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); deleteText(textEl.id) }}
                                                    className="delete-btn"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="control-section">
                            <h4>Content</h4>
                            <textarea
                                placeholder="Enter your text..."
                                value={selectedText?.text || ""}
                                onChange={handleTextChange}
                                className="text-content-input"
                                rows="3"
                            />
                        </div>

                        <div className="control-section">
                            <h4>Typography</h4>
                            <div className="control-group">
                                <label>Font Family</label>
                                <select 
                                    value={selectedText?.fontFamily || "Impact"}
                                    onChange={(e) => updateSelectedText('fontFamily', e.target.value)}
                                >
                                    {fontFamilies.map(font => (
                                        <option key={font} value={font}>{font}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="control-group">
                                <label>Size: {selectedText?.fontSize || 2.5}rem</label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="8"
                                    step="0.1"
                                    value={selectedText?.fontSize || 2.5}
                                    onChange={(e) => updateSelectedText('fontSize', parseFloat(e.target.value))}
                                />
                            </div>
                            <div className="control-group">
                                <label>Letter Spacing: {selectedText?.letterSpacing || 2}px</label>
                                <input
                                    type="range"
                                    min="-2"
                                    max="10"
                                    step="0.5"
                                    value={selectedText?.letterSpacing || 2}
                                    onChange={(e) => updateSelectedText('letterSpacing', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="control-section">
                            <h4>Colors</h4>
                            <div className="color-controls">
                                <div className="color-input-group">
                                    <label>Text Color</label>
                                    <input
                                        type="color"
                                        value={selectedText?.color || "#ffffff"}
                                        onChange={(e) => updateSelectedText('color', e.target.value)}
                                    />
                                </div>
                                <div className="color-input-group">
                                    <label>Outline Color</label>
                                    <input
                                        type="color"
                                        value={selectedText?.strokeColor || "#000000"}
                                        onChange={(e) => updateSelectedText('strokeColor', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="control-group">
                                <label>Outline Width: {selectedText?.strokeWidth || 3}px</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    value={selectedText?.strokeWidth || 3}
                                    onChange={(e) => updateSelectedText('strokeWidth', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="control-section">
                            <h4>Effects</h4>
                            <div className="control-group">
                                <label>Rotation: {selectedText?.rotation || 0}°</label>
                                <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    step="1"
                                    value={selectedText?.rotation || 0}
                                    onChange={(e) => updateSelectedText('rotation', parseFloat(e.target.value))}
                                />
                            </div>
                            <div className="control-group">
                                <label>Opacity: {Math.round((selectedText?.opacity || 1) * 100)}%</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={selectedText?.opacity || 1}
                                    onChange={(e) => updateSelectedText('opacity', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Style Presets */}
                        <div className="control-section">
                            <h4>Style Presets</h4>
                            <div className="preset-grid">
                                {Object.keys(presetStyles).map(preset => (
                                    <button
                                        key={preset}
                                        className="preset-btn"
                                        onClick={() => applyPresetStyle(preset)}
                                    >
                                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "image" && (
                    <div className="tab-content">
                        <div className="control-section">
                            <h4>Template Search</h4>
                            <input
                                type="text"
                                placeholder="🔍 Search templates..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            {searchTerm && (
                                <div className="search-results-grid">
                                    {filteredMemes.slice(0, 12).map(memeTemplate => (
                                        <div
                                            key={memeTemplate.id}
                                            className="template-item"
                                            onClick={() => selectSpecificMeme(memeTemplate.url)}
                                        >
                                            <img src={memeTemplate.url} alt={memeTemplate.name} />
                                            <span className="template-name">{memeTemplate.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="control-section">
                            <h4>Image Adjustments</h4>
                            <div className="control-group">
                                <label>Brightness: {Math.round(meme.brightness * 100)}%</label>
                                <input
                                    type="range"
                                    min="0.3"
                                    max="2"
                                    step="0.05"
                                    name="brightness"
                                    value={meme.brightness}
                                    onChange={handleMemeChange}
                                />
                            </div>
                            <div className="control-group">
                                <label>Contrast: {Math.round(meme.contrast * 100)}%</label>
                                <input
                                    type="range"
                                    min="0.3"
                                    max="2"
                                    step="0.05"
                                    name="contrast"
                                    value={meme.contrast}
                                    onChange={handleMemeChange}
                                />
                            </div>
                            <div className="control-group">
                                <label>Saturation: {Math.round(meme.saturation * 100)}%</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.05"
                                    name="saturation"
                                    value={meme.saturation}
                                    onChange={handleMemeChange}
                                />
                            </div>
                        </div>

                        <div className="control-section">
                            <button className="primary-btn" onClick={getMemeImage} disabled={isLoading}>
                                {isLoading ? "Loading..." : "🎲 Random Template"}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "library" && (
                    <div className="tab-content">
                        <div className="control-section">
                            <h4>Quick Actions</h4>
                            <div className="action-buttons">
                                <button className="primary-btn" onClick={downloadMeme}>
                                    📥 Download Meme
                                </button>
                                <button className="secondary-btn" onClick={addToFavorites}>
                                    ❤️ Save to Favorites
                                </button>
                                <button className="secondary-btn" onClick={resetPositions}>
                                    📍 Reset Positions
                                </button>
                                <button 
                                    className="secondary-btn"
                                    onClick={() => setShowPreview(!showPreview)}
                                >
                                    {showPreview ? "📝 Edit Mode" : "👁️ Preview"}
                                </button>
                            </div>
                        </div>

                        {favorites.length > 0 && (
                            <div className="control-section">
                                <h4>Your Favorites ({favorites.length})</h4>
                                <div className="favorites-list">
                                    {favorites.slice(-6).reverse().map(fav => (
                                        <div 
                                            key={fav.id} 
                                            className="favorite-card"
                                            onClick={() => loadFavorite(fav)}
                                        >
                                            <img src={fav.imageUrl} alt="Favorite" />
                                            <div className="favorite-info">
                                                <span className="favorite-name">{fav.name}</span>
                                                <span className="favorite-date">{fav.timestamp}</span>
                                                <span className="favorite-count">{fav.textElements.length} texts</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="canvas-area">
                <div className="canvas-header">
                    <div className="canvas-title">
                        <h3>Canvas</h3>
                        <span className="canvas-info">
                            {textElements.length} text element{textElements.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="canvas-controls">
                        <button 
                            className={`view-btn ${showPreview ? 'active' : ''}`}
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            {showPreview ? "📝" : "👁️"}
                        </button>
                    </div>
                </div>

                <div 
                    className={`meme-canvas ${showPreview ? 'preview-mode' : ''}`}
                    ref={memeRef}
                    style={{ cursor: dragState.isDragging ? 'grabbing' : 'default' }}
                >
                    <img 
                        src={meme.imageUrl} 
                        alt="Meme template"
                        style={{ 
                            filter: `brightness(${meme.brightness}) contrast(${meme.contrast}) saturate(${meme.saturation})`
                        }}
                    />
                    {textElements.map(textEl => (
                        <span 
                            key={textEl.id}
                            className={`meme-text ${textEl.id === selectedTextId && !showPreview ? 'selected' : ''}`}
                            style={{
                                fontSize: `${textEl.fontSize}rem`,
                                left: `${textEl.position.x}%`,
                                top: `${textEl.position.y}%`,
                                transform: `translate(-50%, -50%) rotate(${textEl.rotation}deg)`,
                                cursor: showPreview ? 'default' : 'grab',
                                maxWidth: '90%',
                                color: textEl.color,
                                fontFamily: textEl.fontFamily,
                                fontWeight: textEl.fontWeight,
                                letterSpacing: `${textEl.letterSpacing}px`,
                                opacity: textEl.opacity,
                                textAlign: textEl.textAlign,
                                WebkitTextStroke: `${textEl.strokeWidth}px ${textEl.strokeColor}`,
                                textShadow: `${textEl.shadow.x}px ${textEl.shadow.y}px ${textEl.shadow.blur}px ${textEl.shadow.color}, ${textEl.strokeWidth}px ${textEl.strokeWidth}px 0 ${textEl.strokeColor}, -${textEl.strokeWidth}px -${textEl.strokeWidth}px 0 ${textEl.strokeColor}, ${textEl.strokeWidth}px -${textEl.strokeWidth}px 0 ${textEl.strokeColor}, -${textEl.strokeWidth}px ${textEl.strokeWidth}px 0 ${textEl.strokeColor}`,
                                pointerEvents: showPreview ? 'none' : 'auto'
                            }}
                            onMouseDown={!showPreview ? (e) => handleMouseDown(e, textEl.id) : undefined}
                        >
                            {textEl.text}
                        </span>
                    ))}
                    
                </div>
            </div>
        </main>
    )
}