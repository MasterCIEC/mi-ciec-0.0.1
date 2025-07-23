
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useDraft } from '../../contexts/DraftContext';

const FloatingDraftBubble: React.FC = () => {
    const { isDrawerOpen, isDirty, openDrawer, discardDraft, setIsDraggingBubble, discardCount } = useDraft();
    const location = useLocation();
    const bubbleRef = useRef<HTMLButtonElement>(null);

    const getDefaultPosition = useCallback(() => ({
        x: window.innerWidth - 80, // 64px bubble width + 16px right padding
        y: 80, // 64px header height + 16px top padding
    }), []);

    const [position, setPosition] = useState(getDefaultPosition());
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const hasDragged = useRef(false);

    // This combined effect runs on the initial mount and whenever discardCount changes.
    // This ensures the position is set correctly on first load and is reset after a discard action.
    useEffect(() => {
        setPosition(getDefaultPosition());
    }, [discardCount, getDefaultPosition]);

    const handleInteractionStart = (clientX: number, clientY: number) => {
        setIsDragging(true);
        setIsDraggingBubble(true);
        hasDragged.current = false;
        
        if (bubbleRef.current) {
            const rect = bubbleRef.current.getBoundingClientRect();
            dragStartPos.current = {
                x: clientX - rect.left,
                y: clientY - rect.top,
            };
        }
    };

    const handleInteractionMove = (clientX: number, clientY: number) => {
        if (!isDragging || !bubbleRef.current) return;

        if (!hasDragged.current && (Math.abs(clientX - (position.x + dragStartPos.current.x)) > 5 || Math.abs(clientY - (position.y + dragStartPos.current.y)) > 5)) {
            hasDragged.current = true;
        }

        let newX = clientX - dragStartPos.current.x;
        let newY = clientY - dragStartPos.current.y;

        const rect = bubbleRef.current.getBoundingClientRect();
        const constrainedX = Math.max(16, Math.min(newX, window.innerWidth - rect.width - 16));
        const constrainedY = Math.max(16, Math.min(newY, window.innerHeight - rect.height - 16));

        setPosition({ x: constrainedX, y: constrainedY });
    };

    const handleInteractionEnd = () => {
        if (!isDragging) return;

        const discardArea = document.getElementById('discard-area');
        if (discardArea && bubbleRef.current) {
            const bubbleRect = bubbleRef.current.getBoundingClientRect();
            const discardRect = discardArea.getBoundingClientRect();
            const isOverDiscard = (bubbleRect.top + bubbleRect.height / 2) > discardRect.top;
            
            if (isOverDiscard) {
                setIsDragging(false);
                setIsDraggingBubble(false);
                discardDraft();
                return; 
            }
        }
        
        setIsDragging(false);
        setIsDraggingBubble(false);

        // Snap to edge if it was a real drag
        if (bubbleRef.current && hasDragged.current) {
            const bubbleRect = bubbleRef.current.getBoundingClientRect();
            const midpoint = bubbleRect.left + bubbleRect.width / 2;
            if (midpoint < window.innerWidth / 2) {
                setPosition(pos => ({ ...pos, x: 16 }));
            } else {
                setPosition(pos => ({ ...pos, x: window.innerWidth - bubbleRect.width - 16 }));
            }
        }
    };
    
    // Mouse events
    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => handleInteractionStart(e.clientX, e.clientY);
    const handleMouseMove = (e: MouseEvent) => handleInteractionMove(e.clientX, e.clientY);
    const handleMouseUp = () => handleInteractionEnd();
    
    // Touch events
    const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY);
    const handleTouchMove = (e: TouchEvent) => handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);
    const handleTouchEnd = () => handleInteractionEnd();

    useEffect(() => {
        if(isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleTouchEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging]);

    const handleClick = () => {
        if (!hasDragged.current) {
            openDrawer();
        }
    };

    // VIBILITY LOGIC:
    // Show if the drawer is closed AND (we are on the Empresas page OR a draft is in progress)
    const isVisible = !isDrawerOpen && (location.pathname === '/empresas' || isDirty);

    if (!isVisible) return null;
    
    const bubbleClasses = `fixed w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg z-30 cursor-grab active:cursor-grabbing ${
        isDirty ? 'bg-ciec-gold' : 'bg-ciec-blue'
    }`;


    return (
        <button
            ref={bubbleRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onClick={handleClick}
            className={bubbleClasses}
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`,
                transform: `scale(${isDragging ? 1.1 : 1})`,
                transition: isDragging ? 'transform 0.1s ease' : 'transform 0.2s ease, left 0.3s ease, top 0.3s ease'
            }}
            title={isDirty ? "Abrir borrador de empresa" : "Añadir nueva empresa"}
        >
            <Building2 size={28} />
        </button>
    );
};

export default FloatingDraftBubble;
