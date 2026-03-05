'use client'

import { useState, useTransition } from 'react'
import { Button, Input } from '@ciclo/ui'
import { createFAQ, updateFAQ, deleteFAQ, reorderFAQs } from '../../lib/actions/events'

// ============================================================
// Types
// ============================================================

interface FAQItem {
  id: string
  question: string
  answer: string
  order: number
}

interface FAQManagerProps {
  eventId: string
  faqs: FAQItem[]
}

// ============================================================
// FAQ Manager Component
// ============================================================

export function FAQManager({ eventId, faqs: initialFaqs }: FAQManagerProps) {
  const [faqs, setFaqs] = useState(initialFaqs)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleAdd = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return

    startTransition(async () => {
      const result = await createFAQ(eventId, newQuestion.trim(), newAnswer.trim())
      if (result.success) {
        setNewQuestion('')
        setNewAnswer('')
        setIsAdding(false)
        // Reload will happen via revalidatePath
      }
    })
  }

  const handleEdit = (faq: FAQItem) => {
    setEditingId(faq.id)
    setEditQuestion(faq.question)
    setEditAnswer(faq.answer)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editQuestion.trim() || !editAnswer.trim()) return

    startTransition(async () => {
      const result = await updateFAQ(editingId, editQuestion.trim(), editAnswer.trim())
      if (result.success) {
        setFaqs((prev) =>
          prev.map((f) =>
            f.id === editingId ? { ...f, question: editQuestion, answer: editAnswer } : f,
          ),
        )
        setEditingId(null)
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteFAQ(id)
      if (result.success) {
        setFaqs((prev) => prev.filter((f) => f.id !== id))
      }
    })
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...faqs]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index]!, newOrder[index - 1]!]
    setFaqs(newOrder)

    startTransition(async () => {
      await reorderFAQs(
        eventId,
        newOrder.map((f) => f.id),
      )
    })
  }

  const handleMoveDown = (index: number) => {
    if (index >= faqs.length - 1) return
    const newOrder = [...faqs]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1]!, newOrder[index]!]
    setFaqs(newOrder)

    startTransition(async () => {
      await reorderFAQs(
        eventId,
        newOrder.map((f) => f.id),
      )
    })
  }

  return (
    <div className="space-y-4">
      {/* FAQ List */}
      {faqs.length === 0 && !isAdding && (
        <p className="text-sm text-gray-500">Nenhuma FAQ adicionada.</p>
      )}

      {faqs.map((faq, index) => (
        <div key={faq.id} className="rounded-lg border border-gray-200 p-4">
          {editingId === faq.id ? (
            <div className="space-y-3">
              <Input
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                placeholder="Pergunta"
              />
              <textarea
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
                placeholder="Resposta"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={isPending}>
                  Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{faq.question}</h4>
                  <p className="mt-1 text-sm text-gray-600">{faq.answer}</p>
                </div>
                <div className="ml-4 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || isPending}
                    aria-label="Mover para cima"
                  >
                    ^
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index >= faqs.length - 1 || isPending}
                    aria-label="Mover para baixo"
                  >
                    v
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(faq)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleDelete(faq.id)}
                    disabled={isPending}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add FAQ Form */}
      {isAdding ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 space-y-3">
          <Input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Pergunta"
          />
          <textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Resposta"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={isPending}>
              Adicionar FAQ
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAdding(false)
                setNewQuestion('')
                setNewAnswer('')
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
          + Adicionar FAQ
        </Button>
      )}
    </div>
  )
}
