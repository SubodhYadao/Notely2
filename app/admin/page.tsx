"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  UsersIcon,
  FileTextIcon,
  SearchIcon,
  EyeIcon,
  LogOutIcon,
  ShieldIcon,
  CalendarIcon,
  MailIcon,
  UserIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  auth_provider: string
  created_at: string
  notes_count: number
}

interface Note {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  user_name: string
  user_email: string
}

interface AdminStats {
  total_users: number
  total_notes: number
  users_today: number
  notes_today: number
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [userNotes, setUserNotes] = useState<Note[]>([])
  const [loadingUserNotes, setLoadingUserNotes] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      const [usersRes, notesRes, statsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/notes"),
        fetch("/api/admin/stats"),
      ])

      if (!usersRes.ok || !notesRes.ok || !statsRes.ok) {
        if (usersRes.status === 403 || notesRes.status === 403 || statsRes.status === 403) {
          router.push("/auth/signin")
          return
        }
        throw new Error("Failed to fetch admin data")
      }

      const [usersData, notesData, statsData] = await Promise.all([usersRes.json(), notesRes.json(), statsRes.json()])

      setUsers(usersData)
      setNotes(notesData)
      setStats(statsData)
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserNotes = async (userId: string) => {
    setLoadingUserNotes(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setUserNotes(data)
      }
    } catch (error) {
      console.error("Error fetching user notes:", error)
    } finally {
      setLoadingUserNotes(false)
    }
  }

  const handleViewUserNotes = (user: AdminUser) => {
    setSelectedUser(user)
    fetchUserNotes(user.id)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/auth/signin")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.user_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <ShieldIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-semibold">HD Admin</span>
            </div>
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              Administrator
            </Badge>
          </div>

          <Button onClick={handleLogout} variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
            <LogOutIcon className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_users}</div>
                <p className="text-xs text-muted-foreground">+{stats.users_today} today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                <FileTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_notes}</div>
                <p className="text-xs text-muted-foreground">+{stats.notes_today} today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.filter((u) => u.notes_count > 0).length}</div>
                <p className="text-xs text-muted-foreground">Users with notes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Notes/User</CardTitle>
                <FileTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.total_users > 0 ? Math.round((stats.total_notes / stats.total_users) * 10) / 10 : 0}
                </div>
                <p className="text-xs text-muted-foreground">Notes per user</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users, notes, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="notes">All Notes ({notes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{user.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MailIcon className="w-4 h-4" />
                              {user.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>{user.role}</Badge>
                            <Badge variant="outline">{user.auth_provider}</Badge>
                            <Badge variant="outline">{user.notes_count} notes</Badge>
                          </div>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleViewUserNotes(user)}>
                            <EyeIcon className="w-4 h-4 mr-2" />
                            View Notes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Notes by {selectedUser?.name} ({userNotes.length})
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {loadingUserNotes ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              </div>
                            ) : userNotes.length === 0 ? (
                              <p className="text-gray-500 text-center py-8">No notes found</p>
                            ) : (
                              userNotes.map((note) => (
                                <Card key={note.id}>
                                  <CardHeader>
                                    <CardTitle className="text-lg">{note.title}</CardTitle>
                                    <p className="text-sm text-gray-500">
                                      Created: {new Date(note.created_at).toLocaleString()}
                                    </p>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <div className="grid gap-4">
              {filteredNotes.map((note) => (
                <Card key={note.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{note.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>By: {note.user_name}</span>
                          <span>({note.user_email})</span>
                          <span>{new Date(note.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 line-clamp-3">{note.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
