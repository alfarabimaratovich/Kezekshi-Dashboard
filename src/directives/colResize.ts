// ...new file...
import type { Directive } from 'vue'

const MIN_COL_WIDTH = 40

const colResize: Directive = {
    mounted(el: HTMLElement) {
        // ensure th can receive absolute handle
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative'
        el.style.overflow = 'hidden'

        const handle = document.createElement('div')
        handle.className = 'col-resizer-handle'
        Object.assign(handle.style, {
            position: 'absolute',
            right: '0px',
            top: '0px',
            width: '8px',
            height: '100%',
            cursor: 'col-resize',
            zIndex: '20',
            touchAction: 'none',
        })
        el.appendChild(handle)

        let startX = 0
        let startWidth = 0
        let dragging = false

        const onMove = (clientX: number) => {
            const dx = clientX - startX
            const newW = Math.max(MIN_COL_WIDTH, startWidth + dx)
            el.style.width = `${newW}px`
        }

        const onMouseMove = (e: MouseEvent) => {
            if (!dragging) return
            onMove(e.clientX)
        }
        const onMouseUp = () => {
            if (!dragging) return
            dragging = false
            document.body.style.userSelect = ''
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }
        const onMouseDown = (e: MouseEvent) => {
            e.preventDefault()
            dragging = true
            startX = e.clientX
            startWidth = el.getBoundingClientRect().width
            document.body.style.userSelect = 'none'
            document.addEventListener('mousemove', onMouseMove)
            document.addEventListener('mouseup', onMouseUp)
        }

        // touch support
        const onTouchMove = (e: TouchEvent) => {
            if (!dragging) return
            onMove(e.touches[0].clientX)
        }
        const onTouchEnd = () => {
            if (!dragging) return
            dragging = false
            document.removeEventListener('touchmove', onTouchMove)
            document.removeEventListener('touchend', onTouchEnd)
        }
        const onTouchStart = (e: TouchEvent) => {
            e.preventDefault()
            dragging = true
            startX = e.touches[0].clientX
            startWidth = el.getBoundingClientRect().width
            document.addEventListener('touchmove', onTouchMove, { passive: false })
            document.addEventListener('touchend', onTouchEnd)
        }

        handle.addEventListener('mousedown', onMouseDown)
        handle.addEventListener('touchstart', onTouchStart, { passive: false })

            ; (el as any).__colResize = { handle, onMouseDown, onTouchStart }
    },
    unmounted(el: HTMLElement) {
        const data = (el as any).__colResize
        if (data) {
            data.handle.removeEventListener('mousedown', data.onMouseDown)
            data.handle.removeEventListener('touchstart', data.onTouchStart)
            if (data.handle.parentNode) data.handle.parentNode.removeChild(data.handle)
            delete (el as any).__colResize
        }
    },
}

export default colResize
// ...new file...