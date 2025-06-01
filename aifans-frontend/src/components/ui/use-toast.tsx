"use client"

import * as React from "react"
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react"
import { toast as sonnerToast } from "sonner"

type ToastType = "default" | "success" | "error" | "warning" | "info" | "loading"

interface Toast {
  id: string
  title: string
  description?: string
  type?: ToastType
  duration?: number
  action?: ReactNode
}

export interface ToastContextType {
  toasts: Toast[]
  toast: (props: Omit<Toast, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(
    ({ title, description, type = "default", duration = 5000, action }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9)
      
      // 使用sonner显示通知
      switch (type) {
        case "success":
          sonnerToast.success(title, { description, duration, action })
          break
        case "error":
          sonnerToast.error(title, { description, duration, action })
          break
        case "warning":
          sonnerToast(title, { description, duration, action, icon: "⚠️" })
          break
        case "info":
          sonnerToast.info(title, { description, duration, action })
          break
        case "loading":
          sonnerToast.loading(title, { description })
          break
        default:
          sonnerToast(title, { description, duration, action })
      }
      
      setToasts((toasts) => [...toasts, { id, title, description, type, duration, action }])
      
      return id
    },
    []
  )

  const dismiss = useCallback((id: string) => {
    setToasts((toasts) => toasts.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  
  if (!context) {
    // 如果没有找到Provider，我们直接使用sonner
    return {
      toast: (props: Omit<Toast, "id">) => {
        const { title, description, type = "default", duration = 5000, action } = props
        
        switch (type) {
          case "success":
            sonnerToast.success(title, { description, duration, action })
            break
          case "error":
            sonnerToast.error(title, { description, duration, action })
            break
          case "warning":
            sonnerToast(title, { description, duration, action, icon: "⚠️" })
            break
          case "info":
            sonnerToast.info(title, { description, duration, action })
            break
          case "loading":
            sonnerToast.loading(title, { description })
            break
          default:
            sonnerToast(title, { description, duration, action })
        }
      },
      dismiss: sonnerToast.dismiss,
    }
  }
  
  return context
}

// 直接导出toast函数，兼容现有代码
export const toast = (props: string | Omit<Toast, "id">) => {
  // 如果props是字符串，则转换为对象
  if (typeof props === 'string') {
    sonnerToast(props);
    return;
  }
  
  // 如果是对象，使用sonner直接显示
  const { title, description, type = "default", duration = 5000, action } = props;
      
  switch (type) {
    case "success":
      sonnerToast.success(title, { description, duration, action });
      break;
    case "error":
      sonnerToast.error(title, { description, duration, action });
      break;
    case "warning":
      sonnerToast(title, { description, duration, action, icon: "⚠️" });
      break;
    case "info":
      sonnerToast.info(title, { description, duration, action });
      break;
    case "loading":
      sonnerToast.loading(title, { description });
      break;
    default:
      sonnerToast(title, { description, duration, action });
  }
} 