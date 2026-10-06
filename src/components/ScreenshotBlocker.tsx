'use client'
import { useEffect } from 'react'

export default function ScreenshotBlocker() {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p') || (e.metaKey && e.shiftKey && e.key === 's') || (e.metaKey && e.shiftKey && e.key === '3') || (e.metaKey && e.shiftKey && e.key === '4')) {
                navigator.clipboard.writeText('');
                const oldDisplay = document.body.style.display;
                document.body.style.display = 'none';
                setTimeout(() => {
                    document.body.style.display = oldDisplay;
                }, 1000);
            }
        };
        
        window.addEventListener('keyup', handleKeyDown);
        
        // Prevent right click
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };
        window.addEventListener('contextmenu', handleContextMenu);

        return () => {
            window.removeEventListener('keyup', handleKeyDown);
            window.removeEventListener('contextmenu', handleContextMenu);
        }
    }, [])

    return (
        <style dangerouslySetInnerHTML={{__html: `
            @media print {
                html, body {
                    display: none !important;
                    background-color: black !important;
                }
            }
            body {
                -webkit-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
        `}} />
    )
}
