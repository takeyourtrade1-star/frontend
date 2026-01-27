/**
 * MessagesTab Component
 * Tab per visualizzare messaggi
 */

import { useState, useEffect } from 'react'
import { Mail, MailOpen, User, Clock } from 'lucide-react'
import { fetchMessages } from '@/services/accountService'
import type { Message } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'

export default function MessagesTab() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    loadMessages()
  }, [currentPage, itemsPerPage])

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      const response = await fetchMessages(currentPage, itemsPerPage)
      setMessages(response.data)
      setTotalPages(response.last_page)
      setTotalItems(response.total)
    } catch (error) {
      // Silently handle loading errors
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return `Oggi, ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
    } else if (days === 1) {
      return 'Ieri'
    } else if (days < 7) {
      return `${days} giorni fa`
    } else {
      return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'short', day: 'numeric' })
    }
  }

  const handleMessageClick = (message: Message) => {
    // TODO: Navigate to message detail
  }

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => handleMessageClick(message)}
                  className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !message.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {message.read ? (
                        <MailOpen className="w-6 h-6 text-gray-400" />
                      ) : (
                        <Mail className="w-6 h-6 text-orange-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {message.from_username && (
                              <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {message.from_username}
                              </span>
                            )}
                            {message.to_username && (
                              <span className="text-sm text-gray-600">
                                → {message.to_username}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">{message.subject}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{message.preview}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {formatDate(message.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(items) => {
                setItemsPerPage(items)
                setCurrentPage(1)
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}




