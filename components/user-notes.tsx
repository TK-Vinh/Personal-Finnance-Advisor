"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getNotes, saveNote } from "@/app/actions/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Plus, Search, FileText, Calendar } from "lucide-react"
import { toast } from "sonner"

interface UserNotesProps {
    symbol?: string
}

export default function UserNotes({ symbol }: UserNotesProps) {
    const { data: session } = useSession()
    const [notes, setNotes] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [newNote, setNewNote] = useState({ title: "", content: "" })

    const fetchNotes = async () => {
        setIsLoading(true)
        const data = await getNotes(symbol)
        setNotes(data)
        setIsLoading(false)
    }

    useEffect(() => {
        if (session) {
            fetchNotes()
        }
    }, [session, symbol])

    const handleAddNote = async () => {
        if (!newNote.title || !newNote.content) {
            toast.error("Vui lòng điền đầy đủ tiêu đề và nội dung.")
            return
        }

        try {
            await saveNote(newNote.title, newNote.content, symbol)
            toast.success("Đã lưu ghi chú thành công!")
            setNewNote({ title: "", content: "" })
            setIsAdding(false)
            fetchNotes()
        } catch (error) {
            toast.error("Không thể lưu ghi chú.")
        }
    }

    if (!session) {
        return (
            <Card className="glass border-border/20">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground mb-4 opacity-20" />
                    <p className="text-sm text-muted-foreground">Đăng nhập để xem và lưu ghi chú nghiên cứu của bạn.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="glass border-border/20">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    {symbol ? `Ghi chú ${symbol}` : "Ghi chú của bạn"}
                </CardTitle>
                {!isAdding && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setIsAdding(true)}>
                        <Plus className="w-4 h-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {isAdding && (
                    <div className="space-y-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <Input
                            placeholder="Tiêu đề ghi chú"
                            value={newNote.title}
                            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                            className="bg-background/50 border-border/20"
                        />
                        <Textarea
                            placeholder="Phân tích của bạn..."
                            value={newNote.content}
                            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                            className="bg-background/50 border-border/20 min-h-[100px]"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Hủy</Button>
                            <Button size="sm" onClick={handleAddNote}>Lưu ghi chú</Button>
                        </div>
                    </div>
                )}

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {isLoading ? (
                        <div className="text-center py-4 text-xs text-muted-foreground">Đang tải ghi chú...</div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-4 text-xs text-muted-foreground italic">Chưa có ghi chú. Bắt đầu thêm nghiên cứu của bạn!</div>
                    ) : (
                        notes.map((note) => (
                            <div key={note.id} className="p-3 rounded-lg border border-border/10 hover:border-primary/20 transition-all bg-card/50 group">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-semibold text-foreground truncate">{note.title}</h4>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(note.createdAt).toLocaleDateString("vi-VN")}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{note.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
